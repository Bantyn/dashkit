/**
 * CleanupValidator
 * Enforces ALL safety gates before a data cleanup begins.
 *
 * Safety gates:
 *  1. Provider reachability
 *  2. Repository availability
 *  3. Protected module gate (plans, admin_users, platform_settings, etc.)
 *  4. Production environment gate
 *  5. Confirmation token ("DELETE")
 */

import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";
import { ConnectionTester } from "./connection-tester";
import { DatabaseConfigService } from "./db-config.service";

export type CleanupModule =
  | "categories"
  | "brands"
  | "products"
  | "inventory"
  | "inventory_history"
  | "customers"
  | "suppliers"
  | "purchase_orders"
  | "orders"
  | "invoices"
  | "payments"
  | "staff"
  | "notifications"
  | "activity_logs"
  | "usage_tracking"
  | "reports"
  | "temporary_cache"
  | "session_data"
  | "analytics";

// These modules are PROTECTED — never cleaned without forceProtected=true
export const PROTECTED_MODULES = new Set([
  "admin_users",
  "platform_settings",
  "plans",
  "features",
  "subscription_config",
  "db_config",
  "repository_config",
  "system_metadata",
]);

export interface CleanupConfig {
  provider: string;
  cleaningMode: "full" | "selected";
  modules: CleanupModule[];
  confirmationToken: string; // Must be exactly "DELETE"
  options: {
    deleteCloudinaryImages: boolean;
    deleteFirebaseStorage: boolean;
    clearRedisCache: boolean;
    resetCounters: boolean;
    resetAutoIncrementIds: boolean;
    keepAdminAccount: boolean;
    keepDemoConfig: boolean;
    keepFeatureFlags: boolean;
    keepSubscriptionPlans: boolean;
  };
  forceProduction?: boolean; // Must be explicitly true to clean production
  forceProtected?: boolean;  // Super Admin override for protected modules
  requestMeta?: {
    executedBy: string;
    ip: string;
    userAgent?: string;
  };
}

export interface CleanupValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  affectedModules: string[];
  estimatedRecords: number;
  details: {
    connectionOk: boolean;
    repositoryOk: boolean;
    confirmationOk: boolean;
    productionSafe: boolean;
    protectedModulesSafe: boolean;
  };
}

const SUPPORTED_PROVIDERS = ["firestore", "supabase", "mongodb", "sqlserver"];

export class CleanupValidator {
  static async validate(config: CleanupConfig): Promise<CleanupValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    let connectionOk = false;
    let repositoryOk = false;
    let confirmationOk = false;
    let productionSafe = false;
    let protectedModulesSafe = false;

    // 1. Provider check
    if (!SUPPORTED_PROVIDERS.includes(config.provider)) {
      errors.push(`Unsupported provider: "${config.provider}".`);
    }

    // 2. Confirmation token
    if (config.confirmationToken !== "DELETE") {
      errors.push('Confirmation token must be exactly "DELETE". Please type DELETE to confirm.');
    } else {
      confirmationOk = true;
    }

    // 3. Connection test
    try {
      const dbConfig = await DatabaseConfigService.getConfig(config.provider);
      if (!dbConfig && config.provider !== "firestore") {
        errors.push(`No configuration found for "${config.provider}".`);
      } else {
        const connResult = await ConnectionTester.testConnection(config.provider, dbConfig || {});
        if (connResult.success) {
          connectionOk = true;
        } else {
          errors.push(`Connection failed: ${connResult.message}`);
        }
      }
    } catch (err: any) {
      errors.push(`Connection check error: ${err.message}`);
    }

    // 4. Repository check
    try {
      RepositoryFactory.getProductRepository();
      repositoryOk = true;
    } catch (err: any) {
      errors.push(`Repository error: ${err.message}`);
    }

    // 5. Protected modules gate
    const requestedModules = config.cleaningMode === "full"
      ? [...config.modules]
      : config.modules;

    const requestedProtected = requestedModules.filter(m => PROTECTED_MODULES.has(m));
    if (requestedProtected.length > 0 && !config.forceProtected) {
      errors.push(
        `Protected modules cannot be cleaned: ${requestedProtected.join(", ")}. ` +
        `These require Super Admin override (forceProtected: true).`
      );
    } else {
      protectedModulesSafe = true;
    }

    // 6. Production environment gate
    const nodeEnv = process.env.NODE_ENV || "development";
    if (nodeEnv === "production") {
      if (config.cleaningMode === "full" && !config.forceProduction) {
        errors.push(
          "Full database cleanup is BLOCKED in Production. Enable maintenance mode and set forceProduction=true."
        );
      } else {
        productionSafe = true;
        warnings.push("⚠️ You are cleaning a LIVE production database. This action is irreversible.");
      }
    } else {
      productionSafe = true;
    }

    // 7. Modules check for selected mode
    if (config.cleaningMode === "selected" && (!config.modules || config.modules.length === 0)) {
      errors.push("At least one module must be selected for cleanup.");
    }

    const affectedModules = requestedModules.filter(m => !PROTECTED_MODULES.has(m) || config.forceProtected);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      affectedModules,
      estimatedRecords: 0, // Set by caller after preview
      details: { connectionOk, repositoryOk, confirmationOk, productionSafe, protectedModulesSafe },
    };
  }
}
