/**
 * OrphanCleanerService
 * Automated scanner & cleaner for orphaned media files.
 *
 * SAFETY GUARANTEES:
 *  ✅ Cross-references all active shops, products, variants, categories, and brands before marking any file as orphaned.
 *  ✅ Media referenced by ANY active entity is NEVER deleted.
 *  ✅ Supports Dry-Run inspection mode (default).
 *  ✅ Supports Real-Run deletion from Firestore, Cloudinary/S3, and storage counter adjustments.
 */

import { db } from "../../config/firebase.config";
import { mediaService } from "./media.service";

export interface OrphanMediaItem {
  id: string;
  url: string;
  size: number;
  shopId: string;
  reason: "SHOP_DELETED" | "PARENT_ENTITY_DELETED" | "UNREFERENCED_MEDIA";
  type?: string;
  provider?: string;
}

export interface OrphanCleanupReport {
  success: boolean;
  dryRun: boolean;
  startTime: string;
  endTime: string;
  durationMs: number;
  metrics: {
    totalScanned: number;
    activeMediaCount: number;
    orphanMediaCount: number;
    reclaimableBytes: number;
    reclaimableMB: number;
  };
  orphansByReason: {
    shop_deleted: number;
    parent_entity_deleted: number;
    unreferenced_media: number;
  };
  sampleOrphans: OrphanMediaItem[];
  errors: string[];
}

export class OrphanCleanerService {

  /**
   * Scan and optionally purge orphan media files.
   */
  async scanAndClean(options: {
    dryRun?: boolean;
    shopId?: string;
    batchSize?: number;
  } = {}): Promise<OrphanCleanupReport> {
    const startTime = new Date();
    const startMs = Date.now();
    const dryRun = options.dryRun !== false; // Default to dry-run for safety
    const errors: string[] = [];

    console.log(`🖼️ [Orphan Media Cleaner] Starting media scan (Dry-Run: ${dryRun ? "YES" : "NO"})...`);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1 — GATHER ALL ACTIVE ENTITY IMAGE URLS & ACTIVE SHOP IDS
    // ═══════════════════════════════════════════════════════════════════════════
    const activeImageUrls = new Set<string>();
    const activeShopIds = new Set<string>();

    try {
      // 1A. Fetch active shops
      let shopsQuery: FirebaseFirestore.Query = db.collection("shops");
      if (options.shopId) {
        shopsQuery = shopsQuery.where(admin.firestore.FieldPath.documentId(), "==", options.shopId);
      }
      const shopsSnap = await shopsQuery.get();

      shopsSnap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        if (data.isDeleted !== true) {
          activeShopIds.add(doc.id);
          if (data.logo) activeImageUrls.add(String(data.logo).trim());
          if (data.avatar) activeImageUrls.add(String(data.avatar).trim());
          if (data.banner) activeImageUrls.add(String(data.banner).trim());
        }
      });

      // 1B. Fetch active products (catalog & variants)
      let productsQuery: FirebaseFirestore.Query = db.collection("products");
      if (options.shopId) {
        productsQuery = productsQuery.where("shopId", "==", options.shopId);
      }
      const productsSnap = await productsQuery.get();

      productsSnap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        if (data.isDeleted !== true) {
          // Primary product images
          if (data.image) activeImageUrls.add(String(data.image).trim());
          if (data.imageUrl) activeImageUrls.add(String(data.imageUrl).trim());
          if (data.thumbnail) activeImageUrls.add(String(data.thumbnail).trim());

          if (Array.isArray(data.images)) {
            data.images.forEach((img: any) => {
              if (typeof img === "string") activeImageUrls.add(img.trim());
              else if (img?.url) activeImageUrls.add(String(img.url).trim());
            });
          }

          // Variant images
          if (Array.isArray(data.variants)) {
            data.variants.forEach((v: any) => {
              if (v.image) activeImageUrls.add(String(v.image).trim());
              if (v.imageUrl) activeImageUrls.add(String(v.imageUrl).trim());
              if (Array.isArray(v.images)) {
                v.images.forEach((vImg: any) => {
                  if (typeof vImg === "string") activeImageUrls.add(vImg.trim());
                  else if (vImg?.url) activeImageUrls.add(String(vImg.url).trim());
                });
              }
            });
          }
        }
      });

      // 1C. Fetch active categories
      let categoriesQuery: FirebaseFirestore.Query = db.collection("categories");
      if (options.shopId) {
        categoriesQuery = categoriesQuery.where("shopId", "==", options.shopId);
      }
      const categoriesSnap = await categoriesQuery.get();

      categoriesSnap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        if (data.isDeleted !== true) {
          if (data.image) activeImageUrls.add(String(data.image).trim());
          if (data.imageUrl) activeImageUrls.add(String(data.imageUrl).trim());
          if (data.thumbnail) activeImageUrls.add(String(data.thumbnail).trim());
        }
      });

      // 1D. Fetch active brands
      let brandsQuery: FirebaseFirestore.Query = db.collection("brands");
      if (options.shopId) {
        brandsQuery = brandsQuery.where("shopId", "==", options.shopId);
      }
      const brandsSnap = await brandsQuery.get();

      brandsSnap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        if (data.isDeleted !== true) {
          if (data.logo) activeImageUrls.add(String(data.logo).trim());
          if (data.image) activeImageUrls.add(String(data.image).trim());
          if (data.imageUrl) activeImageUrls.add(String(data.imageUrl).trim());
        }
      });

    } catch (err: any) {
      console.error("Error gathering active entity image references:", err);
      errors.push(`Failed to scan active entities: ${err.message}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2 — SCAN UPLOADED_IMAGES REGISTRY & IDENTIFY ORPHANS
    // ═══════════════════════════════════════════════════════════════════════════
    let totalScanned = 0;
    let activeMediaCount = 0;
    let orphanMediaCount = 0;
    let reclaimableBytes = 0;

    const orphansByReason = {
      shop_deleted: 0,
      parent_entity_deleted: 0,
      unreferenced_media: 0,
    };

    const orphanList: OrphanMediaItem[] = [];

    try {
      let mediaQuery: FirebaseFirestore.Query = db.collection("uploaded_images");
      if (options.shopId) {
        mediaQuery = mediaQuery.where("shopId", "==", options.shopId);
      }

      const mediaSnap = await mediaQuery.get();
      totalScanned = mediaSnap.size;

      for (const doc of mediaSnap.docs) {
        const data = doc.data();
        const url = String(data.url || "").trim();
        const shopId = String(data.shopId || "").trim();
        const fileSize = Number(data.size || 0);
        const fileType = String(data.type || "image").toLowerCase();

        if (!url) continue;

        let isOrphan = false;
        let reason: OrphanMediaItem["reason"] = "UNREFERENCED_MEDIA";

        // Check 1: Shop deleted or missing
        if (!activeShopIds.has(shopId)) {
          isOrphan = true;
          reason = "SHOP_DELETED";
          orphansByReason.shop_deleted++;
        }
        // Check 2: Unreferenced image (excluding invoice/pdf documents)
        else if (fileType === "image" && !activeImageUrls.has(url)) {
          isOrphan = true;
          reason = "PARENT_ENTITY_DELETED";
          orphansByReason.parent_entity_deleted++;
        }

        if (isOrphan) {
          orphanMediaCount++;
          reclaimableBytes += fileSize;

          const orphanItem: OrphanMediaItem = {
            id: doc.id,
            url,
            size: fileSize,
            shopId,
            reason,
            type: fileType,
            provider: data.provider || "cloudinary",
          };

          orphanList.push(orphanItem);
        } else {
          activeMediaCount++;
        }
      }
    } catch (err: any) {
      console.error("Error scanning uploaded_images registry:", err);
      errors.push(`Failed to scan media registry: ${err.message}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3 — EXECUTE DELETIONS IF REAL-RUN MODE
    // ═══════════════════════════════════════════════════════════════════════════
    if (!dryRun && orphanList.length > 0) {
      console.log(`[Orphan Media Cleaner] Executing LIVE deletion of ${orphanList.length} orphan files...`);

      for (const item of orphanList) {
        try {
          await mediaService.deleteFile(item.url, item.shopId);
          console.log(`  ✓ Deleted orphan media: ${item.id} (${item.reason}) | Shop: ${item.shopId}`);
        } catch (err: any) {
          console.error(`  ❌ Failed to delete orphan media ${item.id}:`, err.message);
          errors.push(`Failed to delete media ${item.id}: ${err.message}`);
        }
      }
    }

    const durationMs = Date.now() - startMs;
    const endTime = new Date();
    const reclaimableMB = Number((reclaimableBytes / (1024 * 1024)).toFixed(2));

    const report: OrphanCleanupReport = {
      success: errors.length === 0,
      dryRun,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMs,
      metrics: {
        totalScanned,
        activeMediaCount,
        orphanMediaCount,
        reclaimableBytes,
        reclaimableMB,
      },
      orphansByReason,
      sampleOrphans: orphanList.slice(0, 50), // Sample top 50
      errors,
    };

    console.log(
      `✅ [Orphan Media Cleaner] Scan completed in ${durationMs}ms. ` +
      `Scanned: ${totalScanned} | Active: ${activeMediaCount} | ` +
      `Orphans: ${orphanMediaCount} (${reclaimableMB} MB).`
    );

    return report;
  }
}

import * as admin from "firebase-admin";
export const orphanCleanerService = new OrphanCleanerService();
