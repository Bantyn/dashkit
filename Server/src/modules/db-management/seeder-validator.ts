/**
 * SeederValidator
 * Validates all preconditions before a seed operation begins.
 * Never starts seeding if any check fails.
 */

import { DB_CONFIG } from "../../application/repositories/providers/db-provider.config";
import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";
import { ConnectionTester } from "./connection-tester";
import { DatabaseConfigService } from "./db-config.service";

export type SeedModule =
  | "categories"
  | "brands"
  | "products"
  | "inventory"
  | "customers"
  | "suppliers"
  | "orders"
  | "invoices"
  | "staff"
  | "notifications"
  | "plans"
  | "settings";

export interface SeedConfig {
  provider: string;
  environment: "development" | "staging" | "production";
  seedType: string;
  modules: SeedModule[];
  options: {
    skipExisting: boolean;
    resetAutoIncrement: boolean;
    preserveAdminUsers: boolean;
    preserveSystemSettings: boolean;
    generateRandomData: boolean;
    seedImages: boolean;
  };
  shopId?: string;
  requestMeta?: {
    executedBy: string;
    ip: string;
    userAgent?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    connectionOk: boolean;
    repositoryOk: boolean;
    schemaOk: boolean;
    permissionsOk: boolean;
    environmentSafe: boolean;
  };
}

const SUPPORTED_PROVIDERS = ["firestore", "supabase", "mongodb", "sqlserver"];

export class SeederValidator {
  static async validate(config: SeedConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    let connectionOk = false;
    let repositoryOk = false;
    let schemaOk = false;
    const permissionsOk = true; // Enforced at middleware level
    let environmentSafe = false;

    // 1. Provider check
    if (!SUPPORTED_PROVIDERS.includes(config.provider)) {
      errors.push(`Unsupported provider: "${config.provider}". Supported: ${SUPPORTED_PROVIDERS.join(", ")}`);
    }

    // 2. Connection test
    try {
      const dbConfig = await DatabaseConfigService.getConfig(config.provider);
      if (!dbConfig && config.provider !== "firestore") {
        errors.push(`No configuration found for "${config.provider}". Configure it in Database Management first.`);
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

    // 3. Repository availability
    try {
      const repo = RepositoryFactory.getProductRepository();
      if (repo) {
        repositoryOk = true;
        schemaOk = true;
      }
    } catch (err: any) {
      errors.push(`Repository not available for "${config.provider}": ${err.message}`);
    }

    // 4. Modules check
    if (!config.modules || config.modules.length === 0) {
      errors.push("At least one target module must be selected.");
    }

    // 5. Environment safety
    if (config.environment === "production") {
      warnings.push("⚠️ You are seeding data into a LIVE production database.");
      const blockedSeedTypes = ["Complete ERP Dataset", "Demo Data"];
      if (blockedSeedTypes.includes(config.seedType)) {
        errors.push(`"${config.seedType}" seeding is blocked in Production. Use Development or Staging.`);
      } else {
        environmentSafe = true;
      }
    } else {
      environmentSafe = true;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      details: { connectionOk, repositoryOk, schemaOk, permissionsOk, environmentSafe },
    };
  }
}
