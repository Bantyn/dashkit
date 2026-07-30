/**
 * TailoringMigrationService
 * Handles automated data migration from legacy `tailor_job_cards` collection to `tailoring_jobs`.
 */

import { db } from "../../config/firebase.config";
import { TailoringJob } from "./tailoring.model";

const LEGACY_COLLECTION = "tailor_job_cards";
const TARGET_COLLECTION = "tailoring_jobs";

export interface TailoringMigrationReport {
  success: boolean;
  scanned: number;
  migrated: number;
  deleted: number;
  durationMs: number;
  errors: string[];
}

export class TailoringMigrationService {

  /**
   * Migrate all legacy records from `tailor_job_cards` into `tailoring_jobs`.
   */
  async migrateJobCardsToTailoringJobs(): Promise<TailoringMigrationReport> {
    const startMs = Date.now();
    const errors: string[] = [];
    let scanned = 0;
    let migrated = 0;
    let deleted = 0;

    console.log("🧵 [Tailoring Migration] Checking legacy tailor_job_cards collection...");

    try {
      const legacySnap = await db.collection(LEGACY_COLLECTION).get();
      scanned = legacySnap.size;

      if (scanned === 0) {
        console.log("✓ [Tailoring Migration] No legacy tailor_job_cards found to migrate.");
        return {
          success: true,
          scanned: 0,
          migrated: 0,
          deleted: 0,
          durationMs: Date.now() - startMs,
          errors: [],
        };
      }

      console.log(`[Tailoring Migration] Found ${scanned} legacy job cards to migrate to ${TARGET_COLLECTION}...`);

      const batchSize = 400;
      let batch = db.batch();
      let operationCount = 0;

      for (const doc of legacySnap.docs) {
        const data = doc.data();
        const docId = doc.id;

        const targetRef = db.collection(TARGET_COLLECTION).doc(docId);
        const targetSnap = await targetRef.get();

        // Map legacy fields into TailoringJob structure
        const mappedJob: TailoringJob = {
          id: docId,
          shopId: data.shopId || "unknown_shop",
          tailorId: data.tailorId || "",
          tailorName: data.tailorName || "Tailor",
          assignedWork: Array.isArray(data.assignedWork) ? data.assignedWork : [],
          status: data.status || "assigned",
          performanceRating: data.performanceRating,
          notes: data.notes || "",
          assignedDate: data.assignedDate ? (data.assignedDate?.toDate?.() || new Date(data.assignedDate)) : new Date(),
          completedDate: data.completedDate ? (data.completedDate?.toDate?.() || new Date(data.completedDate)) : undefined,
          createdAt: data.createdAt ? (data.createdAt?.toDate?.() || new Date(data.createdAt)) : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt?.toDate?.() || new Date(data.updatedAt)) : new Date(),
          type: "alteration",
          amount: 0,
          paidAmount: 0,
        };

        if (!targetSnap.exists) {
          batch.set(targetRef, mappedJob, { merge: true });
        } else {
          // Merge missing fields if target doc already exists
          batch.set(targetRef, {
            assignedWork: mappedJob.assignedWork,
            performanceRating: mappedJob.performanceRating,
            assignedDate: mappedJob.assignedDate,
            completedDate: mappedJob.completedDate,
            updatedAt: new Date(),
          }, { merge: true });
        }

        // Remove legacy doc
        batch.delete(doc.ref);

        migrated++;
        deleted++;
        operationCount += 2;

        if (operationCount >= batchSize) {
          await batch.commit();
          batch = db.batch();
          operationCount = 0;
        }
      }

      if (operationCount > 0) {
        await batch.commit();
      }

      console.log(`✅ [Tailoring Migration] Migrated ${migrated} records from ${LEGACY_COLLECTION} into ${TARGET_COLLECTION}.`);

    } catch (err: any) {
      console.error("❌ [Tailoring Migration] Migration failed:", err);
      errors.push(`Migration error: ${err.message}`);
    }

    const durationMs = Date.now() - startMs;

    return {
      success: errors.length === 0,
      scanned,
      migrated,
      deleted,
      durationMs,
      errors,
    };
  }
}

export const tailoringMigrationService = new TailoringMigrationService();
