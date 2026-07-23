import { getSyncProvider } from "../providers/db-provider.config";
import { IProductRepository } from "../interfaces/product-repository.interface";
import { ICustomerRepository } from "../interfaces/customer-repository.interface";
import { IInventoryRepository } from "../interfaces/inventory-repository.interface";
import { IInvoiceRepository } from "../interfaces/invoice-repository.interface";
import { IOrderRepository } from "../interfaces/order-repository.interface";
import { IPurchaseRepository } from "../interfaces/purchase-repository.interface";
import { ITransactionManager } from "../transactions/transaction-manager.interface";
import { IAnalyticsRepository } from "../interfaces/analytics-repository.interface";
import { IAnnouncementRepository } from "../interfaces/announcement-repository.interface";

import { FirestoreProductRepository } from "../firestore/firestore-product.repository";
import { FirestoreCustomerRepository } from "../firestore/firestore-customer.repository";
import { FirestoreInventoryRepository } from "../firestore/firestore-inventory.repository";
import { FirestoreInvoiceRepository } from "../firestore/firestore-invoice.repository";
import { FirestoreOrderRepository } from "../firestore/firestore-order.repository";
import { FirestorePurchaseRepository } from "../firestore/firestore-purchase.repository";
import { FirestoreAnalyticsRepository } from "../firestore/firestore-analytics.repository";
import { FirestoreAnnouncementRepository } from "../firestore/firestore-announcement.repository";

import { SupabaseProductRepository } from "../supabase/supabase-product.repository";
import { SupabaseCustomerRepository } from "../supabase/supabase-customer.repository";
import { SupabaseInventoryRepository } from "../supabase/supabase-inventory.repository";
import { SupabaseInvoiceRepository } from "../supabase/supabase-invoice.repository";
import { SupabaseOrderRepository } from "../supabase/supabase-order.repository";
import { SupabasePurchaseRepository } from "../supabase/supabase-purchase.repository";
import { SupabaseAnalyticsRepository } from "../supabase/supabase-analytics.repository";
import { SupabaseAnnouncementRepository } from "../supabase/supabase-announcement.repository";

import { MongoProductRepository } from "../mongodb/mongo-product.repository";
import { MongoCustomerRepository } from "../mongodb/mongo-customer.repository";
import { MongoInventoryRepository } from "../mongodb/mongo-inventory.repository";
import { MongoInvoiceRepository } from "../mongodb/mongo-invoice.repository";
import { MongoOrderRepository } from "../mongodb/mongo-order.repository";
import { MongoPurchaseRepository } from "../mongodb/mongo-purchase.repository";
import { MongoAnalyticsRepository } from "../mongodb/mongo-analytics.repository";
import { MongoAnnouncementRepository } from "../mongodb/mongo-announcement.repository";

import { SqlServerProductRepository } from "../sqlserver/sqlserver-product.repository";
import { SqlServerCustomerRepository } from "../sqlserver/sqlserver-customer.repository";
import { SqlServerInventoryRepository } from "../sqlserver/sqlserver-inventory.repository";
import { SqlServerInvoiceRepository } from "../sqlserver/sqlserver-invoice.repository";
import { SqlServerOrderRepository } from "../sqlserver/sqlserver-order.repository";
import { SqlServerPurchaseRepository } from "../sqlserver/sqlserver-purchase.repository";
import { SqlServerAnalyticsRepository } from "../sqlserver/sqlserver-analytics.repository";
import { SqlServerAnnouncementRepository } from "../sqlserver/sqlserver-announcement.repository";

export class RepositoryFactory {
  static getProductRepository(): IProductRepository {
    switch (getSyncProvider()) {
      case "firestore":
        return new FirestoreProductRepository();
      case "supabase":
        return new SupabaseProductRepository();
      case "mongodb":
        return new MongoProductRepository();
      case "sqlserver":
        return new SqlServerProductRepository();
      default:
        throw new Error(`Unsupported database provider`);
    }
  }

  static getCustomerRepository(): ICustomerRepository {
    switch (getSyncProvider()) {
      case "firestore":
        return new FirestoreCustomerRepository();
      case "supabase":
        return new SupabaseCustomerRepository();
      case "mongodb":
        return new MongoCustomerRepository();
      case "sqlserver":
        return new SqlServerCustomerRepository();
      default:
        throw new Error(`Unsupported database provider`);
    }
  }

  static getInventoryRepository(): IInventoryRepository {
    switch (getSyncProvider()) {
      case "firestore":
        return new FirestoreInventoryRepository();
      case "supabase":
        return new SupabaseInventoryRepository();
      case "mongodb":
        return new MongoInventoryRepository();
      case "sqlserver":
        return new SqlServerInventoryRepository();
      default:
        throw new Error(`Unsupported database provider`);
    }
  }

  static getInvoiceRepository(): IInvoiceRepository {
    switch (getSyncProvider()) {
      case "firestore":
        return new FirestoreInvoiceRepository();
      case "supabase":
        return new SupabaseInvoiceRepository();
      case "mongodb":
        return new MongoInvoiceRepository();
      case "sqlserver":
        return new SqlServerInvoiceRepository();
      default:
        throw new Error(`Unsupported database provider`);
    }
  }

  static getOrderRepository(): IOrderRepository {
    switch (getSyncProvider()) {
      case "firestore":
        return new FirestoreOrderRepository();
      case "supabase":
        return new SupabaseOrderRepository();
      case "mongodb":
        return new MongoOrderRepository();
      case "sqlserver":
        return new SqlServerOrderRepository();
      default:
        throw new Error(`Unsupported database provider`);
    }
  }

  static getPurchaseRepository(): IPurchaseRepository {
    switch (getSyncProvider()) {
      case "firestore":
        return new FirestorePurchaseRepository();
      case "supabase":
        return new SupabasePurchaseRepository();
      case "mongodb":
        return new MongoPurchaseRepository();
      case "sqlserver":
        return new SqlServerPurchaseRepository();
      default:
        throw new Error(`Unsupported database provider`);
    }
  }

  static getTransactionManager(): ITransactionManager {
    const { FirestoreTransactionManager, SupabaseTransactionManager } = require("../transactions/transaction-manager.interface");
    switch (getSyncProvider()) {
      case "firestore":
        return new FirestoreTransactionManager();
      case "supabase":
        return new SupabaseTransactionManager();
      default:
        throw new Error(`Unsupported database provider for transactions`);
    }
  }

  static getAnalyticsRepository(): IAnalyticsRepository {
    switch (getSyncProvider()) {
      case "firestore":
        return new FirestoreAnalyticsRepository();
      case "supabase":
        return new SupabaseAnalyticsRepository();
      case "mongodb":
        return new MongoAnalyticsRepository();
      case "sqlserver":
        return new SqlServerAnalyticsRepository();
      default:
        throw new Error(`Unsupported database provider for analytics`);
    }
  }

  static getAnnouncementRepository(): IAnnouncementRepository {
    switch (getSyncProvider()) {
      case "firestore":
        return new FirestoreAnnouncementRepository();
      case "supabase":
        return new SupabaseAnnouncementRepository();
      case "mongodb":
        return new MongoAnnouncementRepository();
      case "sqlserver":
        return new SqlServerAnnouncementRepository();
      default:
        throw new Error(`Unsupported database provider for announcements`);
    }
  }
}
