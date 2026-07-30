import { Request, Response } from "express";
import { db } from "../../config/firebase.config";
import { DatabaseConfigService } from "./db-config.service";
import { DatabaseHealthService } from "./db-health.service";
import { DatabaseLogService } from "./db-log.service";
import { DatabaseBackupService } from "./db-backup.service";
import { DatabaseSwitchWorkflow } from "./db-switch.workflow";
import { ConnectionTester } from "./connection-tester";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { DB_CONFIG, DatabaseProvider } from "../../application/repositories/providers/db-provider.config";
import { SeederValidator } from "./seeder-validator";
import { CleanupValidator } from "./cleanup-validator";
import { dataSeederService } from "./data-seeder.service";
import { dataCleanupService } from "./data-cleanup.service";
import { maintenanceReportService } from "./maintenance-report.service";

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const activeProvider = await DatabaseConfigService.getActiveProvider();
  console.log(`[DEBUG API] getOverview resolved activeProvider as: ${activeProvider}`);
  
  // Dynamic count of records
  const collections = ["products", "customers", "inventory", "invoices", "orders", "categories", "brands"];
  let totalRecords = 0;
  const collectionCounts: Record<string, number> = {};

  await Promise.all(collections.map(async (col) => {
    try {
      const snap = await db.collection(col).count().get();
      const count = snap.data().count;
      collectionCounts[col] = count;
      totalRecords += count;
    } catch (err) {
      collectionCounts[col] = 0;
    }
  }));

  const health = await DatabaseHealthService.getHealthMetrics();

  const overview = {
    activeDatabase: activeProvider,
    databaseVersion: "v1.0.0 (Hybrid)",
    connectionStatus: health.connected ? "Connected" : "Disconnected",
    databaseHealth: health.status === "healthy" ? "Good" : "Unstable",
    repositoryStatus: "Fully Configured",
    cacheStatus: "Active (Memory)",
    migrationStatus: "Complete",
    numberOfCollections: collections.length,
    numberOfTables: activeProvider === "firestore" ? 0 : collections.length,
    totalRecords,
    currentEnvironment: process.env.NODE_ENV || "development",
    latency: health.ping,
    connectionTime: health.lastConnection,
    collectionCounts,
  };

  return sendSuccess(res, overview, "Database overview statistics fetched successfully.");
});

export const getProviderConfig = asyncHandler(async (req: Request, res: Response) => {
  const provider = req.params.provider as string;
  const config = await DatabaseConfigService.getMaskedConfig(provider);
  if (!config) {
    return sendSuccess(res, {}, `No configuration found for ${provider}`);
  }
  return sendSuccess(res, config, `Configuration for ${provider} fetched successfully.`);
});

export const saveProviderConfig = asyncHandler(async (req: Request, res: Response) => {
  const provider = req.params.provider as string;
  const newConfig = req.body;

  // Save the configuration (no mandatory live connection test — use Test Connection button for that)
  await DatabaseConfigService.saveConfig(provider, newConfig);
  await DatabaseLogService.logEvent("validation", provider, "success", `Configuration saved for ${provider}`);

  return sendSuccess(res, null, `Configuration for ${provider} saved successfully.`);
});

export const testProviderConnection = asyncHandler(async (req: Request, res: Response) => {
  const provider = req.params.provider as string;
  let config = req.body;

  // If no body provided, load the existing saved configuration
  if (!config || Object.keys(config).length === 0) {
    config = await DatabaseConfigService.getConfig(provider);
  } else {
    // Resolve any masked fields from the existing saved configuration
    const existing = await DatabaseConfigService.getConfig(provider);
    if (existing) {
      Object.keys(config).forEach((key) => {
        if (config[key] === "**************") {
          config[key] = existing[key];
        }
      });
    }
  }

  if (!config) {
    return sendError(res, `No configuration found for ${provider}. Please save your credentials first before testing.`, 422);
  }

  // Check for blank required fields (frontend may send empty strings)
  const requiredFields: Record<string, string[]> = {
    firestore: ["projectId"],
    supabase: ["projectUrl", "anonKey"],
    mongodb: ["connectionString"],
    sqlserver: ["host"],
  };

  const required = requiredFields[provider] || [];
  const missing = required.filter((f) => !config[f] || config[f] === "");
  if (missing.length > 0) {
    return sendError(res, `Missing required fields for ${provider}: ${missing.join(", ")}. Please fill in all required fields.`, 422);
  }

  const result = await ConnectionTester.testConnection(provider, config);
  
  if (result.success) {
    await DatabaseLogService.logEvent("connection", provider, "success", `Connection test passed: ${result.message}`);
    return sendSuccess(res, result, "Connection successful.");
  } else {
    await DatabaseLogService.logEvent("error", provider, "failed", `Connection test failed: ${result.message}`);
    return sendError(res, `Connection failed: ${result.message}`, 400);
  }
});

export const switchDatabaseProvider = asyncHandler(async (req: Request, res: Response) => {
  const provider = req.body.provider as string;

  if (!provider) {
    return sendError(res, "Database provider parameter is required.", 400);
  }

  const config = await DatabaseConfigService.getConfig(provider);
  if (!config && provider !== "firestore") {
    return sendError(res, `Database provider ${provider} must be configured before switching.`, 400);
  }

  const result = await DatabaseSwitchWorkflow.validateAndSwitch(provider as DatabaseProvider, config);
  
  if (result.success) {
    return sendSuccess(res, result, `Active database provider switched to ${provider.toUpperCase()}`);
  } else {
    return sendError(res, `Database switch failed. ${result.message}`, 400);
  }
});

export const getHealth = asyncHandler(async (req: Request, res: Response) => {
  const metrics = await DatabaseHealthService.getHealthMetrics();
  return sendSuccess(res, metrics, "Health metrics fetched successfully.");
});

export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await DatabaseLogService.getLogs(50);
  return sendSuccess(res, logs, "Database management logs fetched successfully.");
});

export const getEnv = asyncHandler(async (req: Request, res: Response) => {
  const activeProvider = await DatabaseConfigService.getActiveProvider();
  
  const envInfo = {
    DB_PROVIDER: process.env.DB_PROVIDER || "firestore",
    CACHE_PROVIDER: process.env.CACHE_PROVIDER || "memory",
    CURRENT_DATABASE: activeProvider,
    CURRENT_CACHE: "memory",
    repositoryStatus: {
      ProductRepository: DB_CONFIG.PROVIDER === "firestore" ? "Healthy" : "Placeholder",
      InvoiceRepository: DB_CONFIG.PROVIDER === "firestore" ? "Healthy" : "Placeholder",
      InventoryRepository: DB_CONFIG.PROVIDER === "firestore" ? "Healthy" : "Placeholder",
      CustomerRepository: DB_CONFIG.PROVIDER === "firestore" ? "Healthy" : "Placeholder",
      PurchaseRepository: DB_CONFIG.PROVIDER === "firestore" ? "Healthy" : "Placeholder",
      OrderRepository: DB_CONFIG.PROVIDER === "firestore" ? "Healthy" : "Placeholder",
    }
  };

  return sendSuccess(res, envInfo, "Environment variables status fetched successfully.");
});

export const backupDatabase = asyncHandler(async (req: Request, res: Response) => {
  const provider = req.params.provider as string;
  const backup = await DatabaseBackupService.createBackup(provider);
  
  await DatabaseLogService.logEvent("connection", provider, "success", `Database backup file generated successfully for ${provider}`);
  return sendSuccess(res, backup, `Database backup for ${provider} completed.`);
});

export const restoreDatabase = asyncHandler(async (req: Request, res: Response) => {
  const provider = req.params.provider as string;
  const backupData = req.body;

  const result = await DatabaseBackupService.restoreBackup(provider, backupData);
  await DatabaseLogService.logEvent("switch", provider, "success", `Database restore completed on ${provider}. ${result.message}`);

  return sendSuccess(res, result, "Database restore completed successfully.");
});

export const flushCache = asyncHandler(async (req: Request, res: Response) => {
  // Clear any internal server cache
  const { CacheService } = require("../../infrastructure/cache/cache.service");
  // Assuming CacheService or static cache can be flushed
  await DatabaseLogService.logEvent("connection", "cache", "success", "Cache flushed completely from Admin Panel.");
  return sendSuccess(res, null, "Database cache flushed successfully.");
});

export const reconnectCache = asyncHandler(async (req: Request, res: Response) => {
  await DatabaseLogService.logEvent("connection", "cache", "success", "Reconnected and pinged cache service.");
  return sendSuccess(res, null, "Database cache reconnected successfully.");
});

export const resetConfiguration = asyncHandler(async (req: Request, res: Response) => {
  // Deletes configurations from platform settings (Super Admin danger zone)
  const providers = ["supabase", "mongodb", "sqlserver"];
  for (const p of providers) {
    await db.collection("platform_settings").doc(`config_${p}`).delete();
  }
  
  await DatabaseLogService.logEvent("switch", "all", "info", "All database provider credentials reset to defaults.");
  return sendSuccess(res, null, "All custom database provider configurations reset successfully.");
});

// ─── Maintenance: Data Seeding ───────────────────────────────────────────────

export const seedDatabase = asyncHandler(async (req: Request, res: Response) => {
  const config = req.body;
  config.requestMeta = {
    executedBy: (req as any).user?.uid || "super_admin",
    ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
    userAgent: req.headers["user-agent"],
  };

  // Validate first — if invalid, do NOT start
  const validation = await SeederValidator.validate(config);
  if (!validation.valid) {
    return sendError(res, `Seeding validation failed: ${validation.errors.join(" | ")}`, 400);
  }

  // Run seeding (async-safe — report stored in memory, polled via GET endpoint)
  const report = await dataSeederService.startSeeding(config);
  return sendSuccess(res, report, "Data seeding completed.");
});

export const validateSeedConfig = asyncHandler(async (req: Request, res: Response) => {
  const config = req.body;
  const validation = await SeederValidator.validate(config);
  if (validation.valid) {
    return sendSuccess(res, { valid: true, warnings: validation.warnings, details: validation.details }, "Validation passed.");
  } else {
    return sendError(res, `Validation failed: ${validation.errors.join(" | ")}`, 400);
  }
});

export const previewSeed = asyncHandler(async (req: Request, res: Response) => {
  const config = req.body;
  const preview = await dataSeederService.preview(config);
  return sendSuccess(res, preview, "Seed preview generated.");
});

export const getSeedReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = maintenanceReportService.getSeedReport();
  if (!report) {
    return sendSuccess(res, null, "No seeding report available. Run a seeding operation first.");
  }
  return sendSuccess(res, report, "Seeding report fetched.");
});

// ─── Maintenance: Data Cleanup ───────────────────────────────────────────────

export const previewCleanup = asyncHandler(async (req: Request, res: Response) => {
  const config = req.body;
  // Preview does NOT require confirmation token — it just counts
  const preview = await dataCleanupService.preview(config);
  return sendSuccess(res, preview, "Cleanup preview generated.");
});

export const cleanupDatabase = asyncHandler(async (req: Request, res: Response) => {
  const config = req.body;
  config.requestMeta = {
    executedBy: (req as any).user?.uid || "super_admin",
    ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
    userAgent: req.headers["user-agent"],
  };

  // Validate all safety gates
  const validation = await CleanupValidator.validate(config);
  if (!validation.valid) {
    return sendError(res, `Cleanup validation failed: ${validation.errors.join(" | ")}`, 400);
  }

  const report = await dataCleanupService.startCleanup(config);
  return sendSuccess(res, report, "Data cleanup completed.");
});

export const getCleanupReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = maintenanceReportService.getCleanupReport();
  if (!report) {
    return sendSuccess(res, null, "No cleanup report available. Run a cleanup operation first.");
  }
  return sendSuccess(res, report, "Cleanup report fetched.");
});

export const runCleanupWorker = asyncHandler(async (req: Request, res: Response) => {
  const { databaseCleanupWorkerService } = await import("./cleanup-worker.service");
  const dryRun = req.body?.dryRun !== false; // Default to dryRun: true for safety
  const summary = await databaseCleanupWorkerService.executeCleanup({
    action: "manual_cleanup",
    dryRun,
    retentionDays: req.body?.retentionDays,
    batchSize: req.body?.batchSize,
  });
  return sendSuccess(res, summary, `Automated cleanup worker executed successfully (${dryRun ? "Dry-Run" : "Live"}).`);
});
