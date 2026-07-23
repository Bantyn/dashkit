import { db } from "../../config/firebase.config";

export class DatabaseBackupService {
  private static CORE_COLLECTIONS = [
    "products",
    "customers",
    "inventory",
    "invoices",
    "orders",
    "categories",
    "brands",
    "platform_settings",
  ];

  static async createBackup(provider: string): Promise<any> {
    if (provider !== "firestore") {
      // Mock backups for supabase, mongodb, sqlserver
      return {
        backupVersion: "1.0.0",
        provider,
        timestamp: new Date().toISOString(),
        recordsCount: 150,
        simulated: true,
        data: {
          message: `This is a simulated backup for ${provider} database provider.`,
          tables: ["products", "customers", "orders", "inventory"],
        },
      };
    }

    // Actual Firestore backup
    const backup: any = {
      backupVersion: "1.0.0",
      provider: "firestore",
      timestamp: new Date().toISOString(),
      collections: {},
    };

    for (const col of this.CORE_COLLECTIONS) {
      try {
        const snap = await db.collection(col).get();
        backup.collections[col] = snap.docs.map((doc: any) => ({
          id: doc.id,
          data: doc.data(),
        }));
      } catch (err) {
        console.error(`Failed to backup collection ${col}:`, err);
      }
    }

    return backup;
  }

  static async restoreBackup(
    provider: string,
    backupData: any
  ): Promise<{ success: boolean; restoredCount: number; message: string }> {
    if (!backupData || !backupData.provider) {
      throw new Error("Invalid backup data format. Missing provider information.");
    }

    if (provider === "supabase") {
      const collections = backupData.collections;
      if (!collections) throw new Error("No collections data found in backup.");
      
      const { SupabaseManager } = require("../../infrastructure/supabase/supabase.client");
      const supabase = await SupabaseManager.getClient();
      
      let restoredCount = 0;
      for (const colName of Object.keys(collections)) {
        const docs = collections[colName];
        if (!Array.isArray(docs) || docs.length === 0) continue;
        
        // Transform the Firestore raw docs to our Supabase table schema
        // { id, shopId, branchId, data }
        const mappedItems = docs.map(doc => {
          return {
            id: doc.id,
            shopId: doc.data?.shopId || "system",
            branchId: doc.data?.branchId || null,
            data: doc.data
          };
        });

        // Supabase bulk upsert (skip if already exists)
        const { error } = await supabase.from(colName).upsert(mappedItems, { ignoreDuplicates: true });
        if (error) {
          console.error(`Supabase restore failed for collection ${colName}:`, error.message);
          // Continue with other collections or throw
        } else {
          restoredCount += docs.length;
        }
      }

      return {
        success: true,
        restoredCount,
        message: `Supabase data migration successful. Restored ${restoredCount} documents.`,
      };
    } else if (provider !== "firestore") {
      // Mock restore success for MongoDB and SQL Server until Phase 2 & 3
      return {
        success: true,
        restoredCount: backupData.recordsCount || 100,
        message: `Simulated backup restore successful for ${provider}.`,
      };
    }

    let restoredCount = 0;
    const collections = backupData.collections;

    if (!collections) {
      throw new Error("No collections data found in backup.");
    }

    for (const colName of Object.keys(collections)) {
      const docs = collections[colName];
      if (!Array.isArray(docs)) continue;

      // Pre-fetch existing document IDs to skip duplicates
      const existingDocsSnap = await db.collection(colName).select().get();
      const existingIds = new Set(existingDocsSnap.docs.map((d: any) => d.id));

      // Firestore batches are limited to 500 operations
      let batch = db.batch();
      let operations = 0;

      for (const docInfo of docs) {
        if (!docInfo.id || !docInfo.data) continue;
        if (existingIds.has(docInfo.id)) continue; // Skip if already exists

        const ref = db.collection(colName).doc(docInfo.id);
        batch.set(ref, docInfo.data); // No merge needed since it's uniquely new
        operations++;
        restoredCount++;

        if (operations === 400) {
          await batch.commit();
          batch = db.batch();
          operations = 0;
        }
      }

      if (operations > 0) {
        await batch.commit();
      }
    }

    return {
      success: true,
      restoredCount,
      message: `Database restored successfully. Restored ${restoredCount} documents across ${Object.keys(collections).length} collections.`,
    };
  }
}
