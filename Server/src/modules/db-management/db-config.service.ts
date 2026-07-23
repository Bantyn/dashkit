import { db } from "../../config/firebase.config";
import { encrypt, decrypt } from "../../shared/utils/crypto";

const SETTINGS_COLLECTION = "platform_settings";
const ACTIVE_DB_DOC = "active_db";

export class DatabaseConfigService {
  private static activeProviderCache: string | null = null;

  static async getActiveProvider(): Promise<string> {
    if (this.activeProviderCache) {
      return this.activeProviderCache;
    }

    try {
      const doc = await db.collection(SETTINGS_COLLECTION).doc(ACTIVE_DB_DOC).get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data.activeProvider) {
          this.activeProviderCache = data.activeProvider;
          return data.activeProvider;
        }
      }
    } catch (err) {
      console.error("Failed to read active db provider from database. Falling back to env.", err);
    }

    const envProvider = process.env.DB_PROVIDER || "firestore";
    this.activeProviderCache = envProvider;
    return envProvider;
  }

  static async setActiveProvider(provider: string): Promise<void> {
    await db.collection(SETTINGS_COLLECTION).doc(ACTIVE_DB_DOC).set({
      activeProvider: provider,
      updatedAt: new Date(),
    });
    this.activeProviderCache = provider;
  }

  static async getConfig(provider: string): Promise<any> {
    const docId = `config_${provider}`;
    const doc = await db.collection(SETTINGS_COLLECTION).doc(docId).get();
    if (!doc.exists) return null;
    return this.decryptConfig(provider, doc.data());
  }

  static async saveConfig(provider: string, config: any): Promise<void> {
    const docId = `config_${provider}`;
    
    // Preserve existing values for masked fields
    const existing = await this.getConfig(provider);
    if (existing) {
      Object.keys(config).forEach((key) => {
        if (config[key] === "**************") {
          config[key] = existing[key];
        }
      });
    }

    const encryptedConfig = this.encryptConfig(provider, config);
    await db.collection(SETTINGS_COLLECTION).doc(docId).set({
      ...encryptedConfig,
      updatedAt: new Date(),
    });
  }

  static async getMaskedConfig(provider: string): Promise<any> {
    const config = await this.getConfig(provider);
    if (!config) return null;

    const masked = { ...config };
    const maskFields = (fields: string[]) => {
      fields.forEach((f) => {
        if (masked[f]) {
          masked[f] = "**************";
        }
      });
    };

    if (provider === "firestore") {
      maskFields(["privateKey", "serviceAccountJson"]);
    } else if (provider === "supabase") {
      maskFields(["anonKey", "serviceRoleKey", "jwtSecret", "databasePassword"]);
    } else if (provider === "mongodb") {
      maskFields(["password", "connectionString"]);
    } else if (provider === "sqlserver") {
      maskFields(["password"]);
    }

    return masked;
  }

  private static encryptConfig(provider: string, config: any): any {
    const encrypted = { ...config };
    const encryptFields = (fields: string[]) => {
      fields.forEach((f) => {
        if (encrypted[f] && encrypted[f] !== "**************") {
          encrypted[f] = encrypt(encrypted[f]);
        }
      });
    };

    if (provider === "firestore") {
      encryptFields(["privateKey", "serviceAccountJson"]);
    } else if (provider === "supabase") {
      encryptFields(["anonKey", "serviceRoleKey", "jwtSecret", "databasePassword"]);
    } else if (provider === "mongodb") {
      encryptFields(["password", "connectionString"]);
    } else if (provider === "sqlserver") {
      encryptFields(["password"]);
    }

    return encrypted;
  }

  private static decryptConfig(provider: string, config: any): any {
    const decrypted = { ...config };
    const decryptFields = (fields: string[]) => {
      fields.forEach((f) => {
        if (decrypted[f]) {
          decrypted[f] = decrypt(decrypted[f]);
        }
      });
    };

    if (provider === "firestore") {
      decryptFields(["privateKey", "serviceAccountJson"]);
    } else if (provider === "supabase") {
      decryptFields(["anonKey", "serviceRoleKey", "jwtSecret", "databasePassword"]);
    } else if (provider === "mongodb") {
      decryptFields(["password", "connectionString"]);
    } else if (provider === "sqlserver") {
      decryptFields(["password"]);
    }

    return decrypted;
  }
}
