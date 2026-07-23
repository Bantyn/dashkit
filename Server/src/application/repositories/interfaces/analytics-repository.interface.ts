export type CollectionKey = 
  | "invoices" 
  | "orders" 
  | "expenses" 
  | "products" 
  | "customers" 
  | "staff" 
  | "inventory" 
  | "branches";

export interface AnalyticsCollectionsBundle {
  invoices: any[];
  orders: any[];
  expenses: any[];
  products: any[];
  customers: any[];
  staff: any[];
  inventory: any[];
  branches: any[];
}

export interface IAnalyticsRepository {
  loadShopData(
    shopId: string,
    needed: CollectionKey[],
    branchId?: string,
    startDate?: Date
  ): Promise<AnalyticsCollectionsBundle>;
}
