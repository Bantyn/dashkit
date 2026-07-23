import { db } from "../../config/firebase.config";
import { DailyStockRecord } from "./daily-stock.model";
import { inventoryService } from "../inventory/inventory.service";
import { CacheService } from "../../infrastructure/cache/cache.service";

const COLLECTION = "daily_stock_records";

export class DailyStockService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 15 * 60 * 1000;

  private getCacheKey(shopId: string, date: string, type: string) {
    return `daily-stock:${shopId}:${date}:${type}`;
  }

  async getTodayRecord(shopId: string, date: string, type: string): Promise<DailyStockRecord | null> {
    const cacheKey = this.getCacheKey(shopId, date, type);
    const cached = this.cache.get<DailyStockRecord | null>(cacheKey);
    if (cached !== undefined) return cached; // Can be null

    const snap = await db.collection(COLLECTION)
      .where("shopId", "==", shopId)
      .where("date", "==", date)
      .where("type", "==", type)
      .limit(1)
      .get();

    const result = snap.empty ? null : (snap.docs[0].data() as DailyStockRecord);
    return this.cache.set(cacheKey, result, this.ttlMs);
  }

  async createRecord(payload: Partial<DailyStockRecord>): Promise<DailyStockRecord> {
    const ref = db.collection(COLLECTION).doc();
    const now = new Date();

    // Compute variance for each entry before saving (closing records)
    const entries = (payload.entries || []).map((entry) => ({
      ...entry,
      variance: payload.type === "closing"
        ? ((entry.physicalCount ?? entry.systemStock ?? 0) - (entry.systemStock ?? 0))
        : (entry.openingCount !== undefined
          ? (entry.openingCount - (entry.systemStock ?? 0))
          : 0),
    }));

    const record: DailyStockRecord = {
      id: ref.id,
      shopId: payload.shopId!,
      date: payload.date!,
      type: payload.type!,
      entries,
      autoAdjust: payload.autoAdjust,
      notes: payload.notes,
      submittedBy: payload.submittedBy,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(record);

    this.cache.delete(this.getCacheKey(record.shopId, record.date, record.type));

    // ── Bug Fix 1: Opening stock submission MUST update actual inventory ──────
    if (record.type === "opening") {
      await this.applyOpeningStock(record);
    }

    // ── Closing with auto-adjust: apply physical count to inventory ───────────
    if (record.type === "closing" && record.autoAdjust) {
      await this.applyAutoAdjust(record);
    }

    return record;
  }

  async updateRecord(id: string, payload: Partial<DailyStockRecord>): Promise<void> {
    const docRef = db.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return;

    const existing = docSnap.data() as DailyStockRecord;
    this.cache.delete(this.getCacheKey(existing.shopId, existing.date, existing.type));

    // Recompute variance for entries
    const entries = (payload.entries || existing.entries || []).map((entry) => ({
      ...entry,
      variance: existing.type === "closing"
        ? ((entry.physicalCount ?? entry.systemStock ?? 0) - (entry.systemStock ?? 0))
        : (entry.openingCount !== undefined
          ? (entry.openingCount - (entry.systemStock ?? 0))
          : 0),
    }));

    const now = new Date();
    await docRef.update({ ...payload, entries, updatedAt: now });

    const updatedRecord: DailyStockRecord = {
      ...existing,
      ...payload,
      entries,
      id,
      updatedAt: now,
    };

    // Re-apply opening stock with updated counts
    // The idempotency guard in inventoryService.updateStock() uses referenceId,
    // so we append "-edit" to force a new movement when the record is edited.
    if (updatedRecord.type === "opening") {
      await this.applyOpeningStock(updatedRecord, true);
    }

    if (updatedRecord.type === "closing" && (payload.autoAdjust ?? existing.autoAdjust)) {
      await this.applyAutoAdjust(updatedRecord);
    }
  }

  /**
   * Bug Fix 1: Apply opening stock entries to the actual inventory collection.
   *
   * For each entry where openingCount differs from systemStock, we call
   * inventoryService.updateStock() with movementType="opening_stock".
   *
   * The idempotency guard in inventoryService prevents double-processing
   * if this method is called twice for the same record.
   *
   * @param isEdit When true, appends "-edit-<timestamp>" to referenceId to allow
   *               re-processing updated counts.
   */
  private async applyOpeningStock(record: DailyStockRecord, isEdit = false): Promise<void> {
    const baseRefId = record.id;

    // Process all entries concurrently to improve performance
    await Promise.allSettled(
      record.entries.map(async (entry) => {
        const openingQty = entry.openingCount ?? entry.systemStock ?? 0;
        const referenceId = isEdit
          ? `${baseRefId}-edit-${Date.now()}`
          : baseRefId;

        try {
          await inventoryService.updateStock({
            productId: entry.productId,
            shopId: record.shopId,
            newStock: openingQty,
            reason: `Daily Opening Stock (${record.date})`,
            movementType: "opening_stock",
            changeType: "set",
            amount: openingQty,
            variantSku: entry.sku || "",
            updatedBy: record.submittedBy || "system",
            referenceId,
            referenceType: "daily_opening",
          });
        } catch (err) {
          console.error(
            `[DailyStock] Failed to apply opening stock for product ${entry.productId}:`,
            err
          );
        }
      })
    );
  }

  /**
   * Bug Fix 2: Apply closing stock physical count adjustments to inventory.
   * Creates inventory_history records with movementType="closing_adjustment"
   * so they appear in variance calculations.
   */
  private async applyAutoAdjust(record: DailyStockRecord): Promise<void> {
    await Promise.allSettled(
      record.entries.map(async (entry) => {
        const physicalCount = entry.physicalCount;
        if (physicalCount === undefined || physicalCount === null) return;
        const variance = physicalCount - (entry.systemStock ?? 0);
        if (variance === 0) return; // No change needed

        try {
          await inventoryService.updateStock({
            productId: entry.productId,
            shopId: record.shopId,
            newStock: physicalCount,
            reason: `Daily Closing Adjustment (${record.date}) — Variance: ${variance > 0 ? "+" : ""}${variance}`,
            movementType: "closing_adjustment",
            changeType: variance > 0 ? "add" : "subtract",
            amount: Math.abs(variance),
            variantSku: entry.sku || "",
            updatedBy: record.submittedBy || "system",
            referenceId: `${record.id}-adj`,
            referenceType: "daily_closing",
          });
        } catch (err) {
          console.error(
            `[DailyStock] Failed to apply closing adjustment for product ${entry.productId}:`,
            err
          );
        }
      })
    );
  }

  /**
   * Get variance report for a shop+date by reading all inventory_history movements.
   */
  async getVarianceReport(shopId: string, date: string): Promise<any[]> {
    return inventoryService.calculateVariance(shopId, date);
  }
}

export const dailyStockService = new DailyStockService();
