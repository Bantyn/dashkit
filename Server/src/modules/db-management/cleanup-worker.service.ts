/**
 * DatabaseCleanupWorkerService
 * Automated retention cleanup engine targeting ONLY log and telemetry collections.
 *
 * SAFETY GUARANTEES:
 *  ❌ STRICTLY PROHIBITED from touching active business collections (shops, users, products, orders, invoices, inventory, etc.)
 *  ✅ ONLY cleans notification_logs, activity_logs, and audit_logs
 *  ✅ Batched deletions (400 per commit)
 *  ✅ Supports dryRun inspection mode
 *  ✅ Full logging and execution summary
 */

import { db } from "../../config/firebase.config";
import { CleanupJobData, CleanupJobSummary } from "../../infrastructure/queue/queue.types";
import { DatabaseLogService } from "./db-log.service";

// Strict whitelist of allowed cleanup target collections
const ALLOWED_COLLECTIONS = new Set([
  "notification_logs",
  "activity_logs",
  "audit_logs",
]);

// Default retention windows (in days)
const DEFAULT_RETENTION_DAYS = {
  notification_logs: 14,
  activity_logs: 30,
  audit_logs: 60,
};

const BATCH_SIZE = 400;

export class DatabaseCleanupWorkerService {

  /**
   * Execute scheduled or manual retention cleanup.
   */
  async executeCleanup(options: CleanupJobData = { action: "daily_cleanup" }): Promise<CleanupJobSummary> {
    const startTimeDate = new Date();
    const startMs = Date.now();
    const dryRun = !!options.dryRun;
    const errors: string[] = [];

    const retentionDays = {
      ...DEFAULT_RETENTION_DAYS,
      ...options.retentionDays,
    };

    console.log(`🧹 [Cleanup Worker] Starting database log cleanup (Dry-Run: ${dryRun ? "YES" : "NO"})...`);

    const summaryDetails: CleanupJobSummary["details"] = {
      notification_logs: { scanned: 0, deleted: 0, cutoffDate: "" },
      activity_logs: { scanned: 0, deleted: 0, cutoffDate: "" },
      audit_logs: { scanned: 0, deleted: 0, cutoffDate: "" },
    };

    let totalDeleted = 0;

    // Process each target collection safely
    for (const collectionName of Array.from(ALLOWED_COLLECTIONS)) {
      if (!ALLOWED_COLLECTIONS.has(collectionName)) {
        errors.push(`SECURITY ALERT: Collection "${collectionName}" is not in the allowed cleanup whitelist.`);
        continue;
      }

      const days = retentionDays[collectionName as keyof typeof DEFAULT_RETENTION_DAYS] || 30;
      const cutoffDate = new Date(nowSubDays(days));
      const cutoffIsoStr = cutoffDate.toISOString();

      const detailsKey = collectionName as keyof CleanupJobSummary["details"];
      summaryDetails[detailsKey].cutoffDate = cutoffIsoStr;

      try {
        const result = await this.cleanCollection(collectionName, cutoffDate, dryRun, options.batchSize || BATCH_SIZE);
        summaryDetails[detailsKey].scanned = result.scanned;
        summaryDetails[detailsKey].deleted = result.deleted;
        totalDeleted += result.deleted;

        console.log(
          `  ✓ [${collectionName}] Cutoff: ${cutoffIsoStr.split("T")[0]} (${days}d retention) | ` +
          `Scanned: ${result.scanned} | ${dryRun ? "Would Delete" : "Deleted"}: ${result.deleted}`
        );
      } catch (err: any) {
        const errMsg = `Error cleaning collection "${collectionName}": ${err.message}`;
        console.error(`  ❌ [${collectionName}] ${errMsg}`);
        errors.push(errMsg);
      }
    }

    const durationMs = Date.now() - startMs;
    const endTimeDate = new Date();

    const summary: CleanupJobSummary = {
      success: errors.length === 0,
      dryRun,
      startTime: startTimeDate.toISOString(),
      endTime: endTimeDate.toISOString(),
      durationMs,
      details: summaryDetails,
      totalDeleted,
      errors,
    };

    // Trim BullMQ Redis memory
    try {
      const { queueManager } = await import("../../infrastructure/queue/queue.manager");
      await queueManager.trimQueues();
    } catch (e: any) {
      console.warn("[Cleanup Worker] Redis queue trimming skipped:", e.message);
    }

    console.log(
      `✅ [Cleanup Worker] ${dryRun ? "Dry-run inspection" : "Log cleanup"} complete in ${durationMs}ms. ` +
      `Total ${dryRun ? "identifiable" : "deleted"} records: ${totalDeleted}. Errors: ${errors.length}`
    );

    // Audit log entry
    await DatabaseLogService.logEvent(
      "switch",
      "firestore",
      summary.success ? "success" : "failed",
      `Automated DB Cleanup (${dryRun ? "Dry-Run" : "Live"}). Deleted/Found: ${totalDeleted} records across 3 log collections in ${durationMs}ms.`,
      {
        dryRun,
        totalDeleted,
        durationMs,
        details: summaryDetails,
        errors,
      }
    ).catch((e) => console.warn("Failed to write cleanup event log:", e.message));

    return summary;
  }

  /**
   * Batched collection deletion handler with retry logic.
   */
  private async cleanCollection(
    collectionName: string,
    cutoffDate: Date,
    dryRun: boolean,
    batchSize: number
  ): Promise<{ scanned: number; deleted: number }> {
    let scanned = 0;
    let deleted = 0;

    // Safety check: ensure target collection is in whitelist
    if (!ALLOWED_COLLECTIONS.has(collectionName)) {
      throw new Error(`Collection "${collectionName}" is not permitted for automated cleanup.`);
    }

    const timestampField = collectionName === "audit_logs" ? "timestamp" : "createdAt";

    while (true) {
      // Query documents older than cutoff
      // Supports string ISO timestamps and Firestore Timestamp fields
      let snapshot: FirebaseFirestore.QuerySnapshot;

      try {
        snapshot = await db
          .collection(collectionName)
          .where(timestampField, "<=", cutoffDate.toISOString())
          .limit(batchSize)
          .get();

        if (snapshot.empty) {
          // Fallback check for Native Date / Firestore Timestamp objects
          snapshot = await db
            .collection(collectionName)
            .where(timestampField, "<=", cutoffDate)
            .limit(batchSize)
            .get();
        }
      } catch (err: any) {
        // Fallback for native Date comparison
        snapshot = await db
          .collection(collectionName)
          .where(timestampField, "<=", cutoffDate)
          .limit(batchSize)
          .get();
      }

      if (snapshot.empty) {
        break;
      }

      scanned += snapshot.size;

      if (dryRun) {
        deleted += snapshot.size;
        // In dry run, stop after scanning first batch to avoid infinite loop
        break;
      }

      // Execute batched deletion with retry backoff
      let retries = 0;
      const maxRetries = 3;
      let batchSuccess = false;

      while (retries < maxRetries && !batchSuccess) {
        try {
          const batch = db.batch();
          snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
          await batch.commit();
          deleted += snapshot.size;
          batchSuccess = true;
        } catch (err: any) {
          retries++;
          console.warn(`⚠️ [Cleanup Worker] Batch delete retry ${retries}/${maxRetries} for "${collectionName}":`, err.message);
          if (retries < maxRetries) {
            await new Promise((res) => setTimeout(res, retries * 1500));
          } else {
            throw err;
          }
        }
      }
    }

    return { scanned, deleted };
  }
}

function nowSubDays(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export const databaseCleanupWorkerService = new DatabaseCleanupWorkerService();
