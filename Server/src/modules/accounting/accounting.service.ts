import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import {
  LedgerEntry,
  AccountingSummary,
  ReceivableEntry,
  PayableEntry,
  GSTReport,
  GSTReportRow,
  PaymentMethod,
} from "./accounting.model";

const INVOICES = "invoices";
const EXPENSES = "expenses";
const RETURNS = "returns";
const CREDIT_NOTES = "credit_notes";
const PURCHASE_ORDERS = "purchase_orders";

export class AccountingService {
  private readonly cache = new CacheService();
  private readonly cacheTtlMs = 60 * 1000;

  private cacheKey(type: string, shopId: string, extra = "") {
    return `accounting:${type}:${shopId}:${extra}`;
  }

  private agingBucket(days: number): "0-30" | "31-60" | "61-90" | "90+" {
    if (days <= 30) return "0-30";
    if (days <= 60) return "31-60";
    if (days <= 90) return "61-90";
    return "90+";
  }

  private daysDiff(dateStr: string): number {
    const then = new Date(dateStr).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - then) / 86400000));
  }

  private toDateStr(val: any): string {
    if (!val) return new Date().toISOString().substring(0, 10);
    if (typeof val === "string") return val.substring(0, 10);
    if (val instanceof Date) return val.toISOString().substring(0, 10);
    if (val._seconds) return new Date(val._seconds * 1000).toISOString().substring(0, 10);
    if (val.seconds) return new Date(val.seconds * 1000).toISOString().substring(0, 10);
    return new Date(val).toISOString().substring(0, 10);
  }

  private isCash(method: string): boolean {
    return ["cash", "cod"].includes((method || "").toLowerCase());
  }

  private isBank(method: string): boolean {
    return ["bank_transfer", "upi", "card", "online", "razorpay"].includes(
      (method || "").toLowerCase()
    );
  }

  // ─── Cash Book ───────────────────────────────────────────────────────────────
  async getCashBook(shopId: string, dateRange?: { start: string; end: string }) {
    const cacheKey = this.cacheKey("cashbook", shopId, JSON.stringify(dateRange));
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const [invoices, expenses, supplierPayments] = await Promise.all([
      this.fetchInvoices(shopId, dateRange),
      this.fetchExpenses(shopId, dateRange),
      this.fetchSupplierPayments(shopId, dateRange),
    ]);

    const entries: LedgerEntry[] = [];

    // Cash invoices = money in
    for (const inv of invoices) {
      if (!this.isCash(inv.paymentMethod)) continue;
      if (!this.inRange(this.toDateStr(inv.invoiceDate || inv.createdAt), dateRange)) continue;
      entries.push({
        id: inv.id,
        shopId,
        date: this.toDateStr(inv.invoiceDate || inv.createdAt),
        narration: `Sales — Invoice #${inv.invoiceNumber || inv.id.slice(-6).toUpperCase()}`,
        type: "credit",
        source: "invoice",
        sourceId: inv.id,
        amount: inv.paidAmount || inv.total || 0,
        paymentMethod: "cash",
        partyName: inv.customerName || "",
        partyId: inv.customerId,
        createdAt: new Date(),
      });
    }

    // Cash expenses = money out
    for (const exp of expenses) {
      if (!this.isCash(exp.paymentMethod)) continue;
      if (!this.inRange(this.toDateStr(exp.date || exp.createdAt), dateRange)) continue;
      entries.push({
        id: exp.id,
        shopId,
        date: this.toDateStr(exp.date || exp.createdAt),
        narration: `Expense — ${exp.category}: ${exp.description || ""}`,
        type: "debit",
        source: "expense",
        sourceId: exp.id,
        amount: exp.amount,
        paymentMethod: "cash",
        createdAt: new Date(),
      });
    }

    // Cash supplier payments = money out
    for (const sp of supplierPayments) {
      if (!this.isCash(sp.paymentMethod)) continue;
      if (!this.inRange(this.toDateStr(sp.paymentDate || sp.createdAt), dateRange)) continue;
      entries.push({
        id: sp.id,
        shopId,
        date: this.toDateStr(sp.paymentDate || sp.createdAt),
        narration: `Supplier Payment — to ${sp.supplierName} for PO #${sp.poNumber || sp.purchaseOrderId?.slice(-6).toUpperCase()}`,
        type: "debit",
        source: "supplier_payment",
        sourceId: sp.id,
        amount: sp.amount,
        paymentMethod: "cash",
        partyName: sp.supplierName,
        partyId: sp.supplierId,
        createdAt: new Date(),
      });
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));
    this.addRunningBalance(entries);

    const totalIn = entries.filter((e) => e.type === "credit").reduce((s, e) => s + e.amount, 0);
    const totalOut = entries.filter((e) => e.type === "debit").reduce((s, e) => s + e.amount, 0);
    const result = { entries, totalIn, totalOut, closingBalance: totalIn - totalOut };

    return this.cache.set(cacheKey, result, this.cacheTtlMs);
  }

  // ─── Bank Book ───────────────────────────────────────────────────────────────
  async getBankBook(shopId: string, dateRange?: { start: string; end: string }) {
    const cacheKey = this.cacheKey("bankbook", shopId, JSON.stringify(dateRange));
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const [invoices, expenses, supplierPayments] = await Promise.all([
      this.fetchInvoices(shopId, dateRange),
      this.fetchExpenses(shopId, dateRange),
      this.fetchSupplierPayments(shopId, dateRange),
    ]);

    const entries: LedgerEntry[] = [];

    for (const inv of invoices) {
      if (!this.isBank(inv.paymentMethod)) continue;
      if (!this.inRange(this.toDateStr(inv.invoiceDate || inv.createdAt), dateRange)) continue;
      entries.push({
        id: inv.id,
        shopId,
        date: this.toDateStr(inv.invoiceDate || inv.createdAt),
        narration: `Sales — Invoice #${inv.invoiceNumber || inv.id.slice(-6).toUpperCase()}`,
        type: "credit",
        source: "invoice",
        sourceId: inv.id,
        amount: inv.paidAmount || inv.total || 0,
        paymentMethod: this.normalizeMethod(inv.paymentMethod),
        referenceNo: inv.paymentDetails?.razorpayPaymentId,
        partyName: inv.customerName || "",
        partyId: inv.customerId,
        createdAt: new Date(),
      });
    }

    for (const exp of expenses) {
      if (!this.isBank(exp.paymentMethod)) continue;
      if (!this.inRange(this.toDateStr(exp.date || exp.createdAt), dateRange)) continue;
      entries.push({
        id: exp.id,
        shopId,
        date: this.toDateStr(exp.date || exp.createdAt),
        narration: `Expense — ${exp.category}: ${exp.description || ""}`,
        type: "debit",
        source: "expense",
        sourceId: exp.id,
        amount: exp.amount,
        paymentMethod: this.normalizeMethod(exp.paymentMethod),
        referenceNo: exp.referenceNo,
        createdAt: new Date(),
      });
    }

    for (const sp of supplierPayments) {
      if (!this.isBank(sp.paymentMethod)) continue;
      if (!this.inRange(this.toDateStr(sp.paymentDate || sp.createdAt), dateRange)) continue;
      entries.push({
        id: sp.id,
        shopId,
        date: this.toDateStr(sp.paymentDate || sp.createdAt),
        narration: `Supplier Payment — to ${sp.supplierName} for PO #${sp.poNumber || sp.purchaseOrderId?.slice(-6).toUpperCase()}`,
        type: "debit",
        source: "supplier_payment",
        sourceId: sp.id,
        amount: sp.amount,
        paymentMethod: this.normalizeMethod(sp.paymentMethod),
        referenceNo: sp.referenceNo,
        partyName: sp.supplierName,
        partyId: sp.supplierId,
        createdAt: new Date(),
      });
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));
    this.addRunningBalance(entries);

    const totalIn = entries.filter((e) => e.type === "credit").reduce((s, e) => s + e.amount, 0);
    const totalOut = entries.filter((e) => e.type === "debit").reduce((s, e) => s + e.amount, 0);
    const result = { entries, totalIn, totalOut, closingBalance: totalIn - totalOut };

    return this.cache.set(cacheKey, result, this.cacheTtlMs);
  }

  // ─── Full Ledger ─────────────────────────────────────────────────────────────
  async getLedger(shopId: string, dateRange?: { start: string; end: string }) {
    const cacheKey = this.cacheKey("ledger", shopId, JSON.stringify(dateRange));
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const [invoices, expenses, returns, supplierPayments] = await Promise.all([
      this.fetchInvoices(shopId, dateRange),
      this.fetchExpenses(shopId, dateRange),
      this.fetchReturns(shopId, dateRange),
      this.fetchSupplierPayments(shopId, dateRange),
    ]);

    const entries: LedgerEntry[] = [];

    for (const inv of invoices) {
      if (!this.inRange(this.toDateStr(inv.invoiceDate || inv.createdAt), dateRange)) continue;
      entries.push({
        id: inv.id,
        shopId,
        date: this.toDateStr(inv.invoiceDate || inv.createdAt),
        narration: `Sales — Invoice #${inv.invoiceNumber || inv.id.slice(-6).toUpperCase()}`,
        type: "credit",
        source: "invoice",
        sourceId: inv.id,
        amount: inv.paidAmount || inv.total || 0,
        paymentMethod: this.normalizeMethod(inv.paymentMethod),
        partyName: inv.customerName || "",
        partyId: inv.customerId,
        createdAt: new Date(),
      });
    }

    for (const exp of expenses) {
      if (!this.inRange(this.toDateStr(exp.date || exp.createdAt), dateRange)) continue;
      entries.push({
        id: exp.id,
        shopId,
        date: this.toDateStr(exp.date || exp.createdAt),
        narration: `Expense — ${exp.category}: ${exp.description || ""}`,
        type: "debit",
        source: "expense",
        sourceId: exp.id,
        amount: exp.amount,
        paymentMethod: this.normalizeMethod(exp.paymentMethod),
        createdAt: new Date(),
      });
    }

    for (const ret of returns) {
      if (!this.inRange(this.toDateStr(ret.returnDate || ret.createdAt), dateRange)) continue;
      entries.push({
        id: ret.id,
        shopId,
        date: this.toDateStr(ret.returnDate || ret.createdAt),
        narration: `Sales Return — ${ret.invoiceNumber || ret.invoiceId?.slice(-6) || ""}`,
        type: "debit",
        source: "return",
        sourceId: ret.id,
        amount: ret.refundAmount || ret.totalAmount || 0,
        paymentMethod: this.normalizeMethod(ret.refundMethod || "cash"),
        partyName: ret.customerName || "",
        createdAt: new Date(),
      });
    }

    for (const sp of supplierPayments) {
      if (!this.inRange(this.toDateStr(sp.paymentDate || sp.createdAt), dateRange)) continue;
      entries.push({
        id: sp.id,
        shopId,
        date: this.toDateStr(sp.paymentDate || sp.createdAt),
        narration: `Supplier Payment — to ${sp.supplierName} for PO #${sp.poNumber || sp.purchaseOrderId?.slice(-6).toUpperCase()}`,
        type: "debit",
        source: "supplier_payment",
        sourceId: sp.id,
        amount: sp.amount,
        paymentMethod: this.normalizeMethod(sp.paymentMethod),
        referenceNo: sp.referenceNo,
        partyName: sp.supplierName,
        partyId: sp.supplierId,
        createdAt: new Date(),
      });
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));
    this.addRunningBalance(entries);

    const totalCredit = entries.filter((e) => e.type === "credit").reduce((s, e) => s + e.amount, 0);
    const totalDebit = entries.filter((e) => e.type === "debit").reduce((s, e) => s + e.amount, 0);
    const result = {
      entries,
      totalCredit,
      totalDebit,
      closingBalance: totalCredit - totalDebit,
    };
    return this.cache.set(cacheKey, result, this.cacheTtlMs);
  }

  // ─── Receivables ─────────────────────────────────────────────────────────────
  async getReceivables(shopId: string) {
    const cacheKey = this.cacheKey("receivables", shopId);
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const invoices = await this.fetchInvoices(shopId, undefined);
    const pending = invoices.filter((inv: any) =>
      ["pending", "partial"].includes(inv.paymentStatus)
    );

    const entries: ReceivableEntry[] = pending.map((inv: any) => {
      const dateStr = this.toDateStr(inv.invoiceDate || inv.createdAt);
      const days = this.daysDiff(dateStr);
      const outstanding = (inv.total || 0) - (inv.paidAmount || 0);
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber || inv.id.slice(-6).toUpperCase(),
        customerId: inv.customerId,
        customerName: inv.customerName || "Unknown",
        customerPhone: inv.customerPhone || "",
        invoiceDate: dateStr,
        dueDate: inv.dueDate ? this.toDateStr(inv.dueDate) : undefined,
        totalAmount: inv.total || 0,
        paidAmount: inv.paidAmount || 0,
        outstanding,
        paymentStatus: inv.paymentStatus,
        agingDays: days,
        agingBucket: this.agingBucket(days),
      };
    });

    entries.sort((a, b) => b.agingDays - a.agingDays);
    const totalOutstanding = entries.reduce((s, e) => s + e.outstanding, 0);
    const bucketSummary = {
      "0-30": entries.filter((e) => e.agingBucket === "0-30").reduce((s, e) => s + e.outstanding, 0),
      "31-60": entries.filter((e) => e.agingBucket === "31-60").reduce((s, e) => s + e.outstanding, 0),
      "61-90": entries.filter((e) => e.agingBucket === "61-90").reduce((s, e) => s + e.outstanding, 0),
      "90+": entries.filter((e) => e.agingBucket === "90+").reduce((s, e) => s + e.outstanding, 0),
    };

    const result = { entries, totalOutstanding, bucketSummary, count: entries.length };
    return this.cache.set(cacheKey, result, this.cacheTtlMs);
  }

  // ─── Payables ────────────────────────────────────────────────────────────────
  async getPayables(shopId: string) {
    const cacheKey = this.cacheKey("payables", shopId);
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const snapshot = await db
      .collection(PURCHASE_ORDERS)
      .where("shopId", "==", shopId)
      .where("paymentStatus", "in", ["pending", "partial", "unpaid"])
      .get();

    const orders = snapshot.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data());

    const entries: PayableEntry[] = orders.map((po: any) => {
      const dateStr = this.toDateStr(po.orderDate || po.createdAt);
      const days = this.daysDiff(dateStr);
      const outstanding = (po.totalAmount || 0) - (po.paidAmount || 0);
      return {
        purchaseOrderId: po.id,
        supplierId: po.supplierId,
        supplierName: po.supplierName || po.supplier?.name || "Unknown Supplier",
        orderDate: dateStr,
        totalAmount: po.totalAmount || 0,
        paidAmount: po.paidAmount || 0,
        outstanding,
        status: po.paymentStatus || "pending",
        agingDays: days,
        agingBucket: this.agingBucket(days),
      };
    });

    entries.sort((a, b) => b.agingDays - a.agingDays);
    const totalOutstanding = entries.reduce((s, e) => s + e.outstanding, 0);
    const bucketSummary = {
      "0-30": entries.filter((e) => e.agingBucket === "0-30").reduce((s, e) => s + e.outstanding, 0),
      "31-60": entries.filter((e) => e.agingBucket === "31-60").reduce((s, e) => s + e.outstanding, 0),
      "61-90": entries.filter((e) => e.agingBucket === "61-90").reduce((s, e) => s + e.outstanding, 0),
      "90+": entries.filter((e) => e.agingBucket === "90+").reduce((s, e) => s + e.outstanding, 0),
    };

    const result = { entries, totalOutstanding, bucketSummary, count: entries.length };
    return this.cache.set(cacheKey, result, this.cacheTtlMs);
  }

  // ─── GST Report ──────────────────────────────────────────────────────────────
  async getGSTReport(shopId: string, dateRange?: { start: string; end: string }): Promise<GSTReport> {
    const cacheKey = this.cacheKey("gst", shopId, JSON.stringify(dateRange));
    const cached = this.cache.get<GSTReport>(cacheKey);
    if (cached) return cached;

    const invoices = await this.fetchInvoices(shopId, dateRange);
    const filtered = invoices.filter((inv: any) =>
      this.inRange(this.toDateStr(inv.invoiceDate || inv.createdAt), dateRange)
    );

    let totalCgst = 0, totalSgst = 0, totalIgst = 0, taxableRevenue = 0;

    for (const inv of filtered) {
      taxableRevenue += Number(inv.subtotal || inv.total || 0);
      totalCgst += Number(inv.cgst || 0);
      totalSgst += Number(inv.sgst || 0);
      totalIgst += Number(inv.igst || 0);
    }

    const totalOutputTax = totalCgst + totalSgst + totalIgst;
    const effectiveTaxRate = taxableRevenue
      ? `${((totalOutputTax / taxableRevenue) * 100).toFixed(2)}%`
      : "0.00%";

    const rows: GSTReportRow[] = [
      { taxBucket: "CGST", taxableSales: taxableRevenue / 2, taxAmount: totalCgst, effectiveRate: taxableRevenue ? `${((totalCgst / (taxableRevenue / 2)) * 100).toFixed(2)}%` : "0%" },
      { taxBucket: "SGST", taxableSales: taxableRevenue / 2, taxAmount: totalSgst, effectiveRate: taxableRevenue ? `${((totalSgst / (taxableRevenue / 2)) * 100).toFixed(2)}%` : "0%" },
      { taxBucket: "IGST", taxableSales: taxableRevenue, taxAmount: totalIgst, effectiveRate: taxableRevenue ? `${((totalIgst / taxableRevenue) * 100).toFixed(2)}%` : "0%" },
      { taxBucket: "Total", taxableSales: taxableRevenue, taxAmount: totalOutputTax, effectiveRate: effectiveTaxRate },
    ];

    const period = dateRange
      ? `${dateRange.start} to ${dateRange.end}`
      : "All Time";

    const result: GSTReport = {
      summary: {
        totalTaxableRevenue: taxableRevenue,
        totalOutputTax,
        totalCgst,
        totalSgst,
        totalIgst,
        effectiveTaxRate,
        taxableInvoiceCount: filtered.length,
      },
      rows,
      period,
    };

    return this.cache.set(cacheKey, result, this.cacheTtlMs);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  private async fetchInvoices(shopId: string, dateRange?: { start: string; end: string }): Promise<any[]> {
    let query = db.collection(INVOICES).where("shopId", "==", shopId);
    if (dateRange) {
      query = query.where("createdAt", ">=", new Date(dateRange.start)).where("createdAt", "<=", new Date(dateRange.end + "T23:59:59.999Z"));
    }
    const snap = await query.get();
    return snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data());
  }

  private async fetchExpenses(shopId: string, dateRange?: { start: string; end: string }): Promise<any[]> {
    let query = db.collection(EXPENSES).where("shopId", "==", shopId);
    if (dateRange) {
      query = query.where("createdAt", ">=", new Date(dateRange.start)).where("createdAt", "<=", new Date(dateRange.end + "T23:59:59.999Z"));
    }
    const snap = await query.get();
    return snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data());
  }

  private async fetchReturns(shopId: string, dateRange?: { start: string; end: string }): Promise<any[]> {
    let query = db.collection(RETURNS).where("shopId", "==", shopId);
    if (dateRange) {
      query = query.where("createdAt", ">=", new Date(dateRange.start)).where("createdAt", "<=", new Date(dateRange.end + "T23:59:59.999Z"));
    }
    const snap = await query.get();
    return snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data());
  }

  private async fetchSupplierPayments(shopId: string, dateRange?: { start: string; end: string }): Promise<any[]> {
    let query = db.collection("supplier_payments").where("shopId", "==", shopId);
    if (dateRange) {
      query = query.where("createdAt", ">=", new Date(dateRange.start)).where("createdAt", "<=", new Date(dateRange.end + "T23:59:59.999Z"));
    }
    const snap = await query.get();
    return snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data());
  }

  private inRange(dateStr: string, range?: { start: string; end: string }): boolean {
    if (!range) return true;
    return dateStr >= range.start && dateStr <= range.end;
  }

  private addRunningBalance(entries: LedgerEntry[]) {
    let balance = 0;
    for (const e of entries) {
      if (e.type === "credit") balance += e.amount;
      else balance -= e.amount;
      e.balance = balance;
    }
  }

  private normalizeMethod(method: string): any {
    const m = (method || "").toLowerCase();
    if (["cash", "cod"].includes(m)) return "cash";
    if (["bank_transfer"].includes(m)) return "bank_transfer";
    if (["upi"].includes(m)) return "upi";
    if (["card"].includes(m)) return "card";
    return "other";
  }
}

export const accountingService = new AccountingService();
