import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import {
  CRMCustomer,
  CustomerSegment,
  SegmentSummary,
  BirthdayEntry,
  AnniversaryEntry,
} from "./crm.model";

const CUSTOMERS = "customers";

export class CRMService {
  private readonly cache = new CacheService();
  private readonly cacheTtlMs = 60 * 1000;

  private cacheKey(type: string, shopId: string) {
    return `crm:${type}:${shopId}`;
  }

  private classifySegment(customer: any): CustomerSegment {
    const totalSpent = Number(customer.totalSpent || 0);
    const totalOrders = Number(customer.totalOrders || 0);

    // Check last activity
    let daysSinceLastPurchase = 9999;
    const lp = customer.lastPurchase;
    if (lp) {
      const lpDate =
        typeof lp === "string"
          ? new Date(lp)
          : lp._seconds
          ? new Date(lp._seconds * 1000)
          : lp instanceof Date
          ? lp
          : null;
      if (lpDate)
        daysSinceLastPurchase = Math.floor((Date.now() - lpDate.getTime()) / 86400000);
    }

    if (daysSinceLastPurchase > 90 && totalOrders > 0) return "at_risk";
    if (totalSpent >= 50000 || totalOrders >= 20) return "vip";
    if (totalSpent >= 20000 || totalOrders >= 10) return "loyal";
    if (totalOrders >= 2) return "regular";
    return "new";
  }

  private todayMMDD(): string {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${mm}-${dd}`;
  }

  private mmdd(dateStr: string): string {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[1]}-${parts[2]}`;
    return "";
  }

  private yearsFromDate(dateStr: string): number {
    if (!dateStr) return 0;
    const then = new Date(dateStr);
    const now = new Date();
    return now.getFullYear() - then.getFullYear();
  }

  private async fetchCustomers(shopId: string): Promise<any[]> {
    const snap = await db.collection(CUSTOMERS).where("shopId", "==", shopId).get();
    return snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data());
  }

  // ─── Segmented Customers ────────────────────────────────────────────────────
  async getSegmentedCustomers(shopId: string) {
    const cacheKey = this.cacheKey("segments", shopId);
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const customers = await this.fetchCustomers(shopId);

    const segmentMeta: Record<CustomerSegment, { label: string; color: string; description: string }> = {
      vip: { label: "VIP", color: "purple", description: "₹50,000+ spent or 20+ orders" },
      loyal: { label: "Loyal", color: "blue", description: "₹20,000+ spent or 10+ orders" },
      regular: { label: "Regular", color: "green", description: "2+ orders" },
      new: { label: "New", color: "teal", description: "1 or fewer orders" },
      at_risk: { label: "At Risk", color: "red", description: "No activity in 90+ days" },
    };

    const buckets: Record<CustomerSegment, any[]> = {
      vip: [], loyal: [], regular: [], new: [], at_risk: [],
    };

    for (const c of customers) {
      const seg = this.classifySegment(c);
      buckets[seg].push({ ...c, segment: seg });
    }

    const summaries: SegmentSummary[] = (Object.keys(buckets) as CustomerSegment[]).map((seg) => {
      const group = buckets[seg];
      const totalRevenue = group.reduce((s, c) => s + Number(c.totalSpent || 0), 0);
      const totalOrders = group.reduce((s, c) => s + Number(c.totalOrders || 0), 0);
      return {
        segment: seg,
        count: group.length,
        totalRevenue,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        ...segmentMeta[seg],
      };
    });

    const result = { summaries, buckets, totalCustomers: customers.length };
    return this.cache.set(cacheKey, result, this.cacheTtlMs);
  }

  // ─── VIP Customers ───────────────────────────────────────────────────────────
  async getVIPCustomers(shopId: string) {
    const cacheKey = this.cacheKey("vip", shopId);
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const customers = await this.fetchCustomers(shopId);
    const vip = customers
      .filter((c) => this.classifySegment(c) === "vip")
      .map((c) => ({ ...c, segment: "vip" as CustomerSegment }))
      .sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0));

    const result = {
      customers: vip,
      count: vip.length,
      totalRevenue: vip.reduce((s, c) => s + Number(c.totalSpent || 0), 0),
    };
    return this.cache.set(cacheKey, result, this.cacheTtlMs);
  }

  // ─── Todays Birthdays ─────────────────────────────────────────────────────
  async getTodaysBirthdays(shopId: string): Promise<BirthdayEntry[]> {
    const customers = await this.fetchCustomers(shopId);
    const today = this.todayMMDD();

    return customers
      .filter((c) => c.dateOfBirth && this.mmdd(c.dateOfBirth) === today)
      .map((c) => ({
        customerId: c.id,
        customerName: c.name || "",
        phoneNumber: c.phoneNumber || "",
        email: c.email,
        dateOfBirth: c.dateOfBirth,
        age: this.yearsFromDate(c.dateOfBirth),
        totalSpent: Number(c.totalSpent || 0),
        totalOrders: Number(c.totalOrders || 0),
        segment: this.classifySegment(c),
      }));
  }

  // ─── Upcoming Birthdays (next 30 days) ───────────────────────────────────
  async getUpcomingBirthdays(shopId: string, days = 30): Promise<BirthdayEntry[]> {
    const customers = await this.fetchCustomers(shopId);
    const now = new Date();

    return customers
      .filter((c) => {
        if (!c.dateOfBirth) return false;
        const parts = c.dateOfBirth.split("-");
        if (parts.length < 3) return false;
        const upcoming = new Date(now.getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (upcoming < now) upcoming.setFullYear(now.getFullYear() + 1);
        const diff = Math.floor((upcoming.getTime() - now.getTime()) / 86400000);
        return diff > 0 && diff <= days;
      })
      .map((c) => ({
        customerId: c.id,
        customerName: c.name || "",
        phoneNumber: c.phoneNumber || "",
        email: c.email,
        dateOfBirth: c.dateOfBirth,
        age: this.yearsFromDate(c.dateOfBirth),
        totalSpent: Number(c.totalSpent || 0),
        totalOrders: Number(c.totalOrders || 0),
        segment: this.classifySegment(c),
      }));
  }

  // ─── Todays Anniversaries ────────────────────────────────────────────────
  async getTodaysAnniversaries(shopId: string): Promise<AnniversaryEntry[]> {
    const customers = await this.fetchCustomers(shopId);
    const today = this.todayMMDD();

    return customers
      .filter((c) => c.anniversaryDate && this.mmdd(c.anniversaryDate) === today)
      .map((c) => ({
        customerId: c.id,
        customerName: c.name || "",
        phoneNumber: c.phoneNumber || "",
        email: c.email,
        anniversaryDate: c.anniversaryDate,
        yearsCompleted: this.yearsFromDate(c.anniversaryDate),
        totalSpent: Number(c.totalSpent || 0),
        totalOrders: Number(c.totalOrders || 0),
        segment: this.classifySegment(c),
      }));
  }

  // ─── Upcoming Anniversaries ───────────────────────────────────────────────
  async getUpcomingAnniversaries(shopId: string, days = 30): Promise<AnniversaryEntry[]> {
    const customers = await this.fetchCustomers(shopId);
    const now = new Date();

    return customers
      .filter((c) => {
        if (!c.anniversaryDate) return false;
        const parts = c.anniversaryDate.split("-");
        if (parts.length < 3) return false;
        const upcoming = new Date(now.getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (upcoming < now) upcoming.setFullYear(now.getFullYear() + 1);
        const diff = Math.floor((upcoming.getTime() - now.getTime()) / 86400000);
        return diff > 0 && diff <= days;
      })
      .map((c) => ({
        customerId: c.id,
        customerName: c.name || "",
        phoneNumber: c.phoneNumber || "",
        email: c.email,
        anniversaryDate: c.anniversaryDate,
        yearsCompleted: this.yearsFromDate(c.anniversaryDate),
        totalSpent: Number(c.totalSpent || 0),
        totalOrders: Number(c.totalOrders || 0),
        segment: this.classifySegment(c),
      }));
  }

  // ─── Recalculate Segments (batch update) ─────────────────────────────────
  async recalculateSegments(shopId: string): Promise<{ updated: number }> {
    const customers = await this.fetchCustomers(shopId);
    const batch = db.batch();
    let updated = 0;

    for (const c of customers) {
      const seg = this.classifySegment(c);
      if (c.segment !== seg) {
        const ref = db.collection(CUSTOMERS).doc(c.id);
        batch.update(ref, { segment: seg, updatedAt: new Date() });
        updated++;
      }
    }

    if (updated > 0) await batch.commit();
    this.cache.delete(this.cacheKey("segments", shopId));
    this.cache.delete(this.cacheKey("vip", shopId));

    return { updated };
  }
}

export const crmService = new CRMService();
