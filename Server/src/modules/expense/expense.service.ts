import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";
import { Expense, ExpenseCategory } from "./expense.model";
import { createNotification } from "../notification/notification.controller";

const COLLECTION = "expenses";
const CATEGORIES_COLLECTION = "expense_categories";
const TRANSACTIONS_COLLECTION = "transactions";

const DEFAULT_CATEGORIES = ["Rent", "Electricity", "Salaries", "Transport", "Marketing", "Maintenance", "Utilities", "Miscellaneous"];

export class ExpenseService {
  private readonly cache = new CacheService();
  private readonly cacheTtlMs = 30 * 1000;

  private getExpensesKey(shopId: string) { return `expenses:${shopId}`; }
  private getCategoriesKey(shopId: string) { return `expense_categories:${shopId}`; }

  invalidateShopCache(shopId: string) {
    this.cache.delete(this.getExpensesKey(shopId));
    try {
      const { analyticsService } = require("../analytics/analytics.service");
      analyticsService.invalidateShopAnalyticsCache(shopId);
    } catch (err) {
      console.error("Failed to invalidate analytics cache:", err);
    }
  }

  async getExpenses(shopId: string): Promise<Expense[]> {
    const cacheKey = this.getExpensesKey(shopId);
    const cached = this.cache.get<Expense[]>(cacheKey);
    if (cached) return cached;

    const snapshot = await db.collection(COLLECTION)
      .where("shopId", "==", shopId)
      .orderBy("date", "desc")
      .limit(200)
      .get();
    const expenses = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as Expense);
    return this.cache.set(cacheKey, expenses, this.cacheTtlMs);
  }

  async createExpense(payload: Partial<Expense>): Promise<Expense> {
    const ref = db.collection(COLLECTION).doc();
    const now = new Date();
    const expense: Expense = {
      id: ref.id,
      shopId: payload.shopId || "",
      category: payload.category || "Miscellaneous",
      amount: payload.amount || 0,
      description: payload.description || "",
      date: payload.date || now.toISOString().substring(0, 10),
      paymentMethod: payload.paymentMethod || "cash",
      referenceNo: payload.referenceNo,
      createdBy: payload.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // Auto-create a transaction record
    const txRef = db.collection(TRANSACTIONS_COLLECTION).doc();
    const transaction = {
      id: txRef.id,
      shopId: expense.shopId,
      type: "expense",
      amount: expense.amount,
      description: `Expense: ${expense.category} - ${expense.description}`,
      paymentMethod: expense.paymentMethod,
      referenceId: ref.id,
      date: expense.date,
      createdAt: now,
      updatedAt: now,
    };

    const batch = db.batch();
    batch.set(ref, { ...expense, transactionId: txRef.id });
    batch.set(txRef, transaction);
    await batch.commit();

    expense.transactionId = txRef.id;

    await createNotification({
      shopId: expense.shopId,
      title: "New Expense Added",
      message: `Rs.${expense.amount} spent on ${expense.category}: ${expense.description}`,
      type: "info",
      link: `/${expense.shopId}/expenses/add`,
    });

    this.invalidateShopCache(expense.shopId);
    return expense;
  }

  async updateExpense(id: string, payload: Partial<Expense>): Promise<void> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) throw new Error("Expense not found");
    const shopId = doc.data()?.shopId;
    await db.collection(COLLECTION).doc(id).update({ ...payload, updatedAt: new Date() });
    this.invalidateShopCache(shopId);
  }

  async deleteExpense(id: string): Promise<void> {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) throw new Error("Expense not found");
    const shopId = doc.data()?.shopId;
    const txId = doc.data()?.transactionId;
    const batch = db.batch();
    batch.delete(db.collection(COLLECTION).doc(id));
    if (txId) batch.delete(db.collection(TRANSACTIONS_COLLECTION).doc(txId));
    await batch.commit();
    this.invalidateShopCache(shopId);
  }

  async getCategories(shopId: string): Promise<ExpenseCategory[]> {
    const cacheKey = this.getCategoriesKey(shopId);
    const cached = this.cache.get<ExpenseCategory[]>(cacheKey);
    if (cached) return cached;

    const snapshot = await db.collection(CATEGORIES_COLLECTION).where("shopId", "==", shopId).get();
    let categories = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as ExpenseCategory);

    if (categories.length === 0) {
      // Seed defaults
      const batch = db.batch();
      const now = new Date();
      categories = DEFAULT_CATEGORIES.map(name => {
        const ref = db.collection(CATEGORIES_COLLECTION).doc();
        const cat: ExpenseCategory = { id: ref.id, shopId, name, createdAt: now, updatedAt: now };
        batch.set(ref, cat);
        return cat;
      });
      await batch.commit();
    }

    return this.cache.set(cacheKey, categories, this.cacheTtlMs);
  }

  async createCategory(shopId: string, name: string, description?: string): Promise<ExpenseCategory> {
    const ref = db.collection(CATEGORIES_COLLECTION).doc();
    const now = new Date();
    const cat: ExpenseCategory = { id: ref.id, shopId, name, description, createdAt: now, updatedAt: now };
    await ref.set(cat);
    this.cache.delete(this.getCategoriesKey(shopId));
    return cat;
  }

  async deleteCategory(id: string): Promise<void> {
    const doc = await db.collection(CATEGORIES_COLLECTION).doc(id).get();
    const shopId = doc.data()?.shopId;
    await db.collection(CATEGORIES_COLLECTION).doc(id).delete();
    this.cache.delete(this.getCategoriesKey(shopId));
  }
}

export const expenseService = new ExpenseService();
