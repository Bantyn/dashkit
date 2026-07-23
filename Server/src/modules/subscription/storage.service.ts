import { db } from "../../config/firebase.config";
import { NotFoundError, ValidationError } from "../../shared/utils/errors";
import { subscriptionService } from "./subscription.service";
import { paymentService } from "./payment.service";

export class StorageService {
  /**
   * Get storage status and configuration details for a shop
   */
  async getStorageStatus(shopId: string) {
    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (!shopDoc.exists) throw new NotFoundError("Shop not found");
    const shopData = shopDoc.data()!;

    let includedMB = shopData.includedStorageMB;
    let includedBytes = shopData.includedStorageBytes;
    if (includedBytes === undefined || includedBytes === null) {
      if (includedMB === undefined || includedMB === null) {
        try {
          const subContext = await subscriptionService.resolveAccessContext({ shopId });
          includedMB = Number(subContext?.limits?.storage_limit_mb ?? 500);
        } catch (e) {
          includedMB = 500;
        }
      }
      includedBytes = includedMB * 1024 * 1024;
    } else if (includedMB === undefined || includedMB === null) {
      includedMB = Number((includedBytes / (1024 * 1024)).toFixed(2));
    }

    let addonBytes = 0;
    if (shopData.storageAddonEnabled && shopData.storageAddonPlan) {
      const planStr = String(shopData.storageAddonPlan);
      if (planStr.includes("1 GB") || planStr.includes("1GB")) addonBytes = 1024 * 1024 * 1024;
      else if (planStr.includes("2 GB") || planStr.includes("2GB")) addonBytes = 2048 * 1024 * 1024;
      else if (planStr.includes("5 GB") || planStr.includes("5GB")) addonBytes = 5120 * 1024 * 1024;
    }

    const totalAllowedMB = Number(( (includedBytes + addonBytes) / (1024 * 1024) ).toFixed(2));
    const currentMB = shopData.currentStorageMB || 0;
    const currentBytes = shopData.currentStorageBytes || 0;
    const remainingMB = Math.max(0, totalAllowedMB - currentMB);
    const percentage = totalAllowedMB > 0 ? (currentMB / totalAllowedMB) * 100 : 0;

    return {
      shopId,
      includedStorageMB: includedMB,
      currentStorageBytes: currentBytes,
      currentStorageMB: currentMB,
      totalAllowedMB,
      remainingMB,
      percentage: Number(percentage.toFixed(2)),
      storageAddonEnabled: !!shopData.storageAddonEnabled,
      storageAddonPlan: shopData.storageAddonPlan || null,
      storageAddonAmount: shopData.storageAddonAmount || 0,
      storageBillingCycle: shopData.storageBillingCycle || "monthly",
      storageRenewDate: shopData.storageRenewDate || shopData.nextBillingDate || null,
      storageLimitReached: !!shopData.storageLimitReached,
      lastStorageCalculation: shopData.lastStorageCalculation || null,
    };
  }

  /**
   * Get detailed usage collection info from usage/storage
   */
  async getDetailedUsage(shopId: string) {
    const docRef = db.collection("usage").doc("storage").collection("shops").doc(shopId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      const status = await this.getStorageStatus(shopId);
      return {
        currentBytes: status.currentStorageBytes,
        currentMB: status.currentStorageMB,
        currentGB: Number((status.currentStorageBytes / (1024 * 1024 * 1024)).toFixed(4)),
        imageCount: 0,
        lastScan: null,
        lastUpload: null,
        lastDelete: null,
      };
    }

    return snapshot.data();
  }

  /**
   * Recalculate storage by scanning the registry and comparing it
   */
  async recalculateStorage(shopId: string) {
    const shopRef = db.collection("shops").doc(shopId);
    const shopDoc = await shopRef.get();
    if (!shopDoc.exists) throw new NotFoundError("Shop not found");
    const shopData = shopDoc.data()!;

    // Query all files in the registry for this shop
    const snapshot = await db.collection("uploaded_images")
      .where("shopId", "==", shopId)
      .get();

    let totalBytes = 0;
    let imageCount = 0;
    snapshot.docs.forEach((doc: any) => {
      totalBytes += Number(doc.data()?.size || 0);
      imageCount++;
    });

    const totalMB = Number((totalBytes / (1024 * 1024)).toFixed(2));

    let includedMB = shopData.includedStorageMB;
    let includedBytes = shopData.includedStorageBytes;
    if (includedBytes === undefined || includedBytes === null) {
      if (includedMB === undefined || includedMB === null) {
        try {
          const subContext = await subscriptionService.resolveAccessContext({ shopId });
          includedMB = Number(subContext?.limits?.storage_limit_mb ?? 500);
        } catch (e) {
          includedMB = 500;
        }
      }
      includedBytes = includedMB * 1024 * 1024;
    } else if (includedMB === undefined || includedMB === null) {
      includedMB = Number((includedBytes / (1024 * 1024)).toFixed(2));
    }

    let addonBytes = 0;
    if (shopData.storageAddonEnabled && shopData.storageAddonPlan) {
      const planStr = String(shopData.storageAddonPlan);
      if (planStr.includes("1 GB") || planStr.includes("1GB")) addonBytes = 1024 * 1024 * 1024;
      else if (planStr.includes("2 GB") || planStr.includes("2GB")) addonBytes = 2048 * 1024 * 1024;
      else if (planStr.includes("5 GB") || planStr.includes("5GB")) addonBytes = 5120 * 1024 * 1024;
    }

    const totalAllowedBytes = includedBytes + addonBytes;
    const percentage = totalAllowedBytes > 0 ? (totalBytes / totalAllowedBytes) * 100 : 0;

    let warningSent: string | null = null;
    if (percentage >= 100) warningSent = "100";
    else if (percentage >= 90) warningSent = "90";
    else if (percentage >= 80) warningSent = "80";

    const updatePayload = {
      includedStorageMB: includedMB,
      includedStorageBytes: includedBytes,
      currentStorageBytes: totalBytes,
      currentStorageMB: totalMB,
      storageLimitReached: percentage >= 100,
      storageWarningSent: warningSent,
      lastStorageCalculation: new Date(),
      updatedAt: new Date()
    };

    // Run updates concurrently
    const batch = db.batch();
    batch.update(shopRef, updatePayload);

    const usageRef = db.collection("usage").doc("storage").collection("shops").doc(shopId);
    batch.set(usageRef, {
      currentBytes: totalBytes,
      currentMB: totalMB,
      currentGB: Number((totalBytes / (1024 * 1024 * 1024)).toFixed(4)),
      imageCount,
      lastScan: new Date(),
      shopId
    }, { merge: true });

    const legacyStorageRef = db.collection("storage_usage").doc(shopId);
    batch.set(legacyStorageRef, {
      shopId,
      usedBytes: totalBytes,
      limitBytes: totalAllowedBytes,
      percentage: Number(percentage.toFixed(2)),
      lastCalculated: new Date()
    }, { merge: true });

    await batch.commit();

    return {
      success: true,
      previousBytes: shopData.currentStorageBytes || 0,
      recalculatedBytes: totalBytes,
      previousMB: shopData.currentStorageMB || 0,
      recalculatedMB: totalMB,
      imageCount,
    };
  }

  /**
   * Purchase storage add-on (Generates Razerpay link)
   */
  async purchaseStorageAddon(params: {
    shopId: string;
    addonSizeGB: 1 | 2 | 5;
    price: number;
    adminId?: string;
  }) {
    const name = `Extra +${params.addonSizeGB} GB Storage`;
    
    // Leverage the unified payment link generator
    const result = await paymentService.createAddonPaymentLink({
      shopId: params.shopId,
      itemKey: `storage_${params.addonSizeGB}gb`,
      itemType: "limit_addon",
      name,
      price: params.price,
      quantity: 1,
      adminId: params.adminId,
      notes: `Storage Add-on purchase (+${params.addonSizeGB} GB)`
    });

    return result;
  }

  /**
   * Cancel storage add-on
   */
  async cancelStorageAddon(shopId: string, adminId?: string) {
    const db = (await import("../../config/firebase.config")).db;
    
    // Find active storage subscription item
    const snap = await db.collection("subscription_items")
      .where("shopId", "==", shopId)
      .where("itemKey", "in", ["storage_1gb", "storage_2gb", "storage_5gb"])
      .where("status", "==", "active")
      .get();

    if (snap.empty) {
      throw new ValidationError("No active storage add-on found for this shop");
    }

    const doc = snap.docs[0];
    await paymentService.cancelAddon(shopId, doc.id, adminId);

    // Update shop config
    await db.collection("shops").doc(shopId).update({
      storageAddonEnabled: false,
      storageAddonPlan: null,
      storageAddonAmount: 0,
      storageLimitReached: false,
      storageWarningSent: null,
      updatedAt: new Date()
    });

    // Force recalculate limits
    await this.recalculateStorage(shopId);

    return { success: true, message: "Storage add-on cancelled successfully" };
  }

  /**
   * Get pricing tiers for storage
   */
  async getStoragePricing() {
    return {
      addons: [
        { sizeGB: 1, price: 49, displayName: "+1 GB Extra" },
        { sizeGB: 2, price: 99, displayName: "+2 GB Extra" },
        { sizeGB: 5, price: 199, displayName: "+5 GB Extra" },
      ],
      warningThresholds: {
        warning: 80,
        critical: 90,
        blocked: 100
      },
      enableStorageBilling: true
    };
  }
}

export const storageService = new StorageService();
