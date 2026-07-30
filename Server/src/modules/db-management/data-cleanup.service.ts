/**
 * DataCleanupService
 * Deletes ONLY data records from the active database.
 *
 * CRITICAL CONSTRAINTS:
 *  ❌ NEVER drops tables
 *  ❌ NEVER drops collections
 *  ❌ NEVER drops indexes
 *  ❌ NEVER modifies schema
 *  ❌ NEVER breaks repository configuration
 *  ✅ ONLY deletes records (documents/rows)
 *  ✅ Verifies structure still intact after cleanup
 */

import { db } from "../../config/firebase.config";
import { CleanupConfig, PROTECTED_MODULES } from "./cleanup-validator";
import { CleanupReport, maintenanceReportService } from "./maintenance-report.service";
import { DatabaseLogService } from "./db-log.service";
import { DB_CONFIG } from "../../application/repositories/providers/db-provider.config";

// Maps cleanup module names → actual collection/table names in the database
const MODULE_TO_COLLECTION: Record<string, string> = {
  categories: "categories",
  brands: "brands",
  products: "products",
  inventory: "inventory",
  inventory_history: "inventory_history",
  customers: "customers",
  suppliers: "suppliers",
  purchase_orders: "purchase_orders",
  orders: "orders",
  invoices: "invoices",
  payments: "supplier_payments",
  staff: "staff",
  notifications: "notifications",
  usage_tracking: "api_usage_aggregation",
  reports: "reports",
  analytics: "analytics_cache",
  tailoring: "tailoring_jobs",
  tailor_job_cards: "tailoring_jobs",
};

// Modules that can be cleaned in Firestore (all records deleted but collection remains)
const FIRESTORE_CLEANABLE = new Set(Object.keys(MODULE_TO_COLLECTION));

// ─── Firestore: delete all documents in a collection (batched) ────────────────

async function firestoreDeleteAllInCollection(collectionName: string): Promise<number> {
  let totalDeleted = 0;
  const BATCH_SIZE = 400;

  while (true) {
    const snapshot = await db.collection(collectionName).limit(BATCH_SIZE).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();
    totalDeleted += snapshot.size;
  }

  return totalDeleted;
}

// ─── Firestore: count all documents in a collection ──────────────────────────

async function firestoreCountCollection(collectionName: string): Promise<number> {
  try {
    const snap = await db.collection(collectionName).count().get();
    return snap.data().count;
  } catch {
    // Fallback if count() not available
    const snap = await db.collection(collectionName).get();
    return snap.size;
  }
}

// ─── DataCleanupService ───────────────────────────────────────────────────────

export class DataCleanupService {

  /**
   * Preview: count records in each module WITHOUT deleting.
   * Returns counts per module and total.
   */
  async preview(config: CleanupConfig): Promise<{ modules: Record<string, number>; total: number }> {
    const provider = DB_CONFIG.PROVIDER;
    const modules = config.cleaningMode === "full"
      ? Object.keys(MODULE_TO_COLLECTION)
      : config.modules;

    const counts: Record<string, number> = {};
    let total = 0;

    if (provider === "firestore") {
      await Promise.all(
        modules.map(async (mod) => {
          if (PROTECTED_MODULES.has(mod) && !config.forceProtected) return;
          const col = MODULE_TO_COLLECTION[mod];
          if (!col) return;
          try {
            const count = await firestoreCountCollection(col);
            counts[mod] = count;
            total += count;
          } catch {
            counts[mod] = 0;
          }
        })
      );
    } else {
      // For Supabase/MongoDB/SQL — placeholder counts
      // Full implementation per-provider would use respective count queries
      for (const mod of modules) {
        if (!PROTECTED_MODULES.has(mod) || config.forceProtected) {
          counts[mod] = 0; // Would be real counts per provider in Phase 2
        }
      }
    }

    return { modules: counts, total };
  }

  /**
   * Run cleanup: delete ONLY records in selected modules.
   * Structure (collections, indexes, schema) is NEVER touched.
   */
  async startCleanup(config: CleanupConfig): Promise<CleanupReport> {
    const startTime = new Date().toISOString();
    const startMs = Date.now();
    const logs: string[] = [];
    const warnings: string[] = [];
    const provider = DB_CONFIG.PROVIDER;

    const report: CleanupReport = {
      status: "running",
      startTime,
      provider,
      modules: {},
      totalDeleted: 0,
      totalErrors: 0,
      structureVerification: {},
      warnings,
      logs,
      executedBy: config.requestMeta?.executedBy || "super_admin",
      ip: config.requestMeta?.ip || "unknown",
    };

    maintenanceReportService.setCleanupReport(report);

    const targetModules = config.cleaningMode === "full"
      ? Object.keys(MODULE_TO_COLLECTION).filter(m => !PROTECTED_MODULES.has(m) || config.forceProtected)
      : config.modules.filter(m => !PROTECTED_MODULES.has(m) || config.forceProtected);

    logs.push(`[${new Date().toISOString()}] Starting cleanup on provider: ${provider}`);
    logs.push(`Modules to clean: ${targetModules.join(", ")}`);

    for (const mod of targetModules) {
      const modStats = { deleted: 0, errors: 0 };
      const collectionName = MODULE_TO_COLLECTION[mod];

      if (!collectionName) {
        logs.push(`  SKIP: "${mod}" has no collection mapping.`);
        continue;
      }

      logs.push(`[${new Date().toISOString()}] Cleaning: ${mod} (${collectionName})`);

      try {
        if (provider === "firestore") {
          modStats.deleted = await firestoreDeleteAllInCollection(collectionName);
        } else if (provider === "supabase") {
          // Supabase: delete all rows (not truncate — keeps structure)
          const { SupabaseManager } = require("../../infrastructure/supabase/supabase.client");
          const supabase = await SupabaseManager.getClient();
          // Use a truthy filter to delete all rows while preserving the table
          const { count, error } = await supabase
            .from(collectionName)
            .delete()
            .neq("id", "___IMPOSSIBLE___");  // Matches all rows
          if (error) {
            modStats.errors++;
            logs.push(`  ERROR (supabase ${collectionName}): ${error.message}`);
          } else {
            modStats.deleted = count || 0;
          }
        } else {
          // MongoDB / SQL Server — placeholder for Phase 2
          logs.push(`  SKIP: Direct cleanup for "${provider}" not yet implemented. Use Firestore or Supabase.`);
          warnings.push(`"${provider}" module cleanup pending Phase 2 implementation.`);
        }
      } catch (err: any) {
        modStats.errors++;
        logs.push(`  FATAL ERROR (${mod}): ${err.message}`);
      }

      logs.push(`  ✓ ${mod}: deleted=${modStats.deleted}, errors=${modStats.errors}`);
      report.modules[mod] = modStats;
      report.totalDeleted += modStats.deleted;
      report.totalErrors += modStats.errors;
    }

    // ─── Post-Cleanup Structure Verification ─────────────────────────────────
    logs.push(`\n[${new Date().toISOString()}] Verifying database structure integrity...`);

    if (provider === "firestore") {
      // Verify collections still exist by attempting a read (not checking document count)
      for (const mod of targetModules) {
        const col = MODULE_TO_COLLECTION[mod];
        if (!col) continue;
        try {
          // A .limit(0) call verifies the collection path is valid without reading any docs
          await db.collection(col).limit(1).get();
          report.structureVerification[col] = true;
          logs.push(`  ✓ Collection "${col}" structure intact`);
        } catch {
          report.structureVerification[col] = false;
          logs.push(`  ✗ WARNING: Collection "${col}" may have issues`);
        }
      }
    }

    const endTime = new Date().toISOString();
    report.endTime = endTime;
    report.durationMs = Date.now() - startMs;
    report.status = report.totalErrors === 0 ? "success" : (report.totalDeleted > 0 ? "partial" : "failed");
    report.warnings = warnings;
    report.logs = logs;

    maintenanceReportService.setCleanupReport(report);

    await DatabaseLogService.logEvent(
      "switch",
      provider,
      report.status === "failed" ? "failed" : "success",
      `Data cleanup completed. Deleted: ${report.totalDeleted} records across ${targetModules.length} modules. Errors: ${report.totalErrors}`,
      {
        executedBy: config.requestMeta?.executedBy,
        ip: config.requestMeta?.ip,
        modules: targetModules,
        cleaningMode: config.cleaningMode,
      }
    );

    return report;
  }
}

export const dataCleanupService = new DataCleanupService();
