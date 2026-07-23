import { db } from "../../config/firebase.config";
import { CacheService } from "../../infrastructure/cache/cache.service";

export class SearchService {
  private readonly cache = new CacheService();
  private readonly datasetCacheTtlMs = 30 * 1000;
  private readonly resultsCacheTtlMs = 15 * 1000;

  private getDatasetCacheKey(shopId: string) {
    return `search-dataset:${shopId}`;
  }

  private getResultsCacheKey(shopId: string, query: string) {
    return `search-results:${shopId}:${query.toLowerCase().trim()}`;
  }

  private async getSearchDataset(shopId: string) {
    const cacheKey = this.getDatasetCacheKey(shopId);
    const cached = this.cache.get<{
      products: any[];
      invoices: any[];
      customers: any[];
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const [productsSnapshot, invoicesSnapshot, customersSnapshot] = await Promise.all([
      db.collection("products").where("shopId", "==", shopId).get(),
      db.collection("invoices").where("shopId", "==", shopId).get(),
      db.collection("customers").where("shopId", "==", shopId).get(),
    ]);

    return this.cache.set(
      cacheKey,
      {
        products: productsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ ...doc.data(), type: "product" })),
        invoices: invoicesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ ...doc.data(), type: "invoice" })),
        customers: customersSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ ...doc.data(), type: "customer" })),
      },
      this.datasetCacheTtlMs,
    );
  }

  async masterSearch(shopId: string, query: string) {
    const searchTerm = query.toLowerCase();
    const resultsCacheKey = this.getResultsCacheKey(shopId, query);
    const cachedResults = this.cache.get<any[]>(resultsCacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    const dataset = await this.getSearchDataset(shopId);

    const products = dataset.products
      .filter(
        (product: any) =>
          product.name?.toLowerCase().includes(searchTerm) ||
          product.category?.toLowerCase().includes(searchTerm),
      );
    const invoices = dataset.invoices
      .filter(
        (invoice: any) =>
          invoice.invoiceNumber?.toLowerCase().includes(searchTerm) ||
          invoice.customerName?.toLowerCase().includes(searchTerm),
      );
    const customers = dataset.customers
      .filter(
        (customer: any) =>
          customer.name?.toLowerCase().includes(searchTerm) ||
          customer.phoneNumber?.toLowerCase().includes(searchTerm),
      );

    return this.cache.set(
      resultsCacheKey,
      [...products.slice(0, 5), ...invoices.slice(0, 5), ...customers.slice(0, 5)],
      this.resultsCacheTtlMs,
    );
  }
}

export const searchService = new SearchService();
