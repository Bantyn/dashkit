/**
 * DataSeederService
 * Seeds demo / initial data into the active database via RepositoryFactory.
 * All DB operations go through repositories — never direct DB calls.
 *
 * IMPORTANT: Business services must NOT be called directly.
 * This service calls repositories directly to avoid triggering business logic
 * side effects (notifications, stock updates, counters, etc.).
 */

import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";
import { SeedConfig } from "./seeder-validator";
import { SeedingReport, maintenanceReportService } from "./maintenance-report.service";
import { DatabaseLogService } from "./db-log.service";
import { MasterSeeder } from "../../database/seeders/MasterSeeder";

// ─── Seed Data Templates ─────────────────────────────────────────────────────

const SEED_CATEGORIES = (shopId: string) => [
  { name: "Men", shopId, isActive: true, description: "Men's clothing & accessories" },
  { name: "Women", shopId, isActive: true, description: "Women's clothing & accessories" },
  { name: "Kids", shopId, isActive: true, description: "Children's clothing" },
  { name: "Accessories", shopId, isActive: true, description: "Bags, belts & more" },
  { name: "Ethnic Wear", shopId, isActive: true, description: "Traditional Indian clothing" },
  { name: "Sports", shopId, isActive: true, description: "Activewear & sportswear" },
];

const SEED_BRANDS = (shopId: string) => [
  { name: "Arrow", shopId, isActive: true },
  { name: "Peter England", shopId, isActive: true },
  { name: "Fabindia", shopId, isActive: true },
  { name: "W for Woman", shopId, isActive: true },
  { name: "Levi's", shopId, isActive: true },
  { name: "Puma", shopId, isActive: true },
];

const SEED_PRODUCTS = (shopId: string) => [
  {
    shopId,
    name: "Classic White Shirt",
    description: "Premium cotton formal shirt",
    category: "men" as const,
    subcategory: "Shirts",
    brand: "Arrow",
    isActive: true,
    showOnStorefront: true,
    tags: ["formal", "cotton"],
    images: [],
    variants: [
      { sku: "CWS-S", size: "S", color: "White", price: 999, stock: 20 },
      { sku: "CWS-M", size: "M", color: "White", price: 999, stock: 30 },
      { sku: "CWS-L", size: "L", color: "White", price: 999, stock: 25 },
    ],
    seo: { metaTitle: "Classic White Shirt", metaDescription: "Premium formal shirt", slug: "classic-white-shirt" },
    salesCount: 0,
    viewCount: 0,
  },
  {
    shopId,
    name: "Floral Kurti",
    description: "Comfortable daily-wear kurti",
    category: "women" as const,
    subcategory: "Kurtis",
    brand: "Fabindia",
    isActive: true,
    showOnStorefront: true,
    tags: ["casual", "floral"],
    images: [],
    variants: [
      { sku: "FK-S", size: "S", color: "Blue", price: 799, stock: 15 },
      { sku: "FK-M", size: "M", color: "Blue", price: 799, stock: 20 },
      { sku: "FK-L", size: "L", color: "Blue", price: 799, stock: 10 },
    ],
    seo: { metaTitle: "Floral Kurti", metaDescription: "Daily-wear kurti", slug: "floral-kurti" },
    salesCount: 0,
    viewCount: 0,
  },
  {
    shopId,
    name: "Slim Fit Jeans",
    description: "Stretch denim slim-fit jeans",
    category: "men" as const,
    subcategory: "Jeans",
    brand: "Levi's",
    isActive: true,
    showOnStorefront: true,
    tags: ["denim", "casual"],
    images: [],
    variants: [
      { sku: "SFJ-30", size: "30", color: "Blue", price: 2499, stock: 12 },
      { sku: "SFJ-32", size: "32", color: "Blue", price: 2499, stock: 15 },
      { sku: "SFJ-34", size: "34", color: "Blue", price: 2499, stock: 8 },
    ],
    seo: { metaTitle: "Slim Fit Jeans", metaDescription: "Stretch denim jeans", slug: "slim-fit-jeans" },
    salesCount: 0,
    viewCount: 0,
  },
];

const SEED_CUSTOMERS = (shopId: string) => [
  { shopId, name: "Arjun Sharma", mobile: "9876543210", email: "arjun@demo.com", tags: ["vip"], totalPurchases: 0, totalSpent: 0 },
  { shopId, name: "Priya Patel", mobile: "9876543211", email: "priya@demo.com", tags: [], totalPurchases: 0, totalSpent: 0 },
  { shopId, name: "Rahul Verma", mobile: "9876543212", email: "rahul@demo.com", tags: ["regular"], totalPurchases: 0, totalSpent: 0 },
  { shopId, name: "Sneha Gupta", mobile: "9876543213", email: "sneha@demo.com", tags: [], totalPurchases: 0, totalSpent: 0 },
  { shopId, name: "Amit Joshi", mobile: "9876543214", email: "amit@demo.com", tags: ["wholesale"], totalPurchases: 0, totalSpent: 0 },
];

const SEED_SUPPLIERS = (shopId: string) => [
  { shopId, name: "Textile Hub Pvt Ltd", contactPerson: "Rajesh Mehta", phone: "9988776655", email: "textile@hub.com", address: "Surat, Gujarat", isActive: true },
  { shopId, name: "Fashion World Exports", contactPerson: "Nita Shah", phone: "9988776644", email: "fw@exports.com", address: "Ahmedabad, Gujarat", isActive: true },
  { shopId, name: "Garment Masters", contactPerson: "Sanjay Kapoor", phone: "9988776633", email: "gm@masters.com", address: "Tirupur, Tamil Nadu", isActive: true },
];

// ─── Module → Firestore Collection Mapping ───────────────────────────────────

const MODULE_COLLECTION_MAP: Record<string, string> = {
  categories: "categories",
  brands: "brands",
  products: "products",
  inventory: "inventory",
  customers: "customers",
  suppliers: "suppliers",
  orders: "orders",
  invoices: "invoices",
  staff: "staff",
  notifications: "notifications",
};

// ─── DataSeederService ────────────────────────────────────────────────────────

export class DataSeederService {

  private async executeMasterSeeder(config: SeedConfig): Promise<SeedingReport> {
    const startTime = new Date().toISOString();
    const startMs = Date.now();
    const master = new MasterSeeder();
    
    const report: SeedingReport = {
      status: "running",
      startTime,
      provider: config.provider,
      environment: config.environment,
      seedType: config.seedType,
      modules: {},
      totalCreated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      warnings: [],
      logs: [`[${new Date().toISOString()}] Starting ${config.seedType} via MasterSeeder system...`],
      executedBy: config.requestMeta?.executedBy || "super_admin",
      ip: config.requestMeta?.ip || "unknown",
    };
    
    maintenanceReportService.setSeedReport(report);
    
    let results: any[] = [];
    if (config.seedType === 'Master Seeder') {
      results = await master.executeAll();
    } else {
      const typeMap: Record<string, string> = {
        'Admin Seeder': 'AdminSeeder',
        'Feature Seeder': 'FeatureSeeder',
        'Plan Seeder': 'PlanSeeder',
        'Settings Seeder': 'PlatformSettingSeeder',
        'Notification Seeder': 'NotificationTemplateSeeder'
      };
      const seederName = typeMap[config.seedType];
      if (seederName) {
        const res = await master.executeSpecific(seederName);
        if (res) results.push(res);
      }
    }
    
    for (const r of results) {
      report.modules[r.seederName] = {
        created: r.totalCreated,
        skipped: r.totalSkipped,
        errors: r.errors.length
      };
      report.totalCreated += r.totalCreated;
      report.totalSkipped += r.totalSkipped;
      report.totalErrors += r.errors.length;
      r.errors.forEach((e: string) => report.logs.push(`[ERROR] ${r.seederName}: ${e}`));
      report.logs.push(`[${new Date().toISOString()}] ${r.seederName} completed.`);
    }
    
    report.endTime = new Date().toISOString();
    report.durationMs = Date.now() - startMs;
    report.status = report.totalErrors === 0 ? "success" : (report.totalCreated > 0 ? "partial" : "failed");
    
    maintenanceReportService.setSeedReport(report);
    
    await DatabaseLogService.logEvent(
      "seeding",
      config.provider,
      report.status === "failed" ? "failed" : "success",
      `${config.seedType} completed. Provider: ${config.provider}, Created: ${report.totalCreated}`,
      { executedBy: report.executedBy, ip: report.ip, seedType: config.seedType }
    );
    
    return report;
  }

  async preview(config: SeedConfig): Promise<Record<string, number>> {
    const preview: Record<string, number> = {};
    const shopId = config.shopId || "demo_shop";

    for (const mod of config.modules) {
      switch (mod) {
        case "categories": preview[mod] = SEED_CATEGORIES(shopId).length; break;
        case "brands": preview[mod] = SEED_BRANDS(shopId).length; break;
        case "products": preview[mod] = SEED_PRODUCTS(shopId).length; break;
        case "customers": preview[mod] = SEED_CUSTOMERS(shopId).length; break;
        case "suppliers": preview[mod] = SEED_SUPPLIERS(shopId).length; break;
        default: preview[mod] = 0;
      }
    }

    return preview;
  }

  async startSeeding(config: SeedConfig): Promise<SeedingReport> {
    const startTime = new Date().toISOString();
    
    const masterSeederTypes = ['Master Seeder', 'Admin Seeder', 'Feature Seeder', 'Plan Seeder', 'Settings Seeder', 'Notification Seeder'];
    if (masterSeederTypes.includes(config.seedType)) {
      return this.executeMasterSeeder(config);
    }
    
    const startMs = Date.now();
    const logs: string[] = [];
    const warnings: string[] = [];

    const report: SeedingReport = {
      status: "running",
      startTime,
      provider: config.provider,
      environment: config.environment,
      seedType: config.seedType,
      modules: {},
      totalCreated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      warnings,
      logs,
      executedBy: config.requestMeta?.executedBy || "super_admin",
      ip: config.requestMeta?.ip || "unknown",
    };

    maintenanceReportService.setSeedReport(report);

    const productRepo = RepositoryFactory.getProductRepository();
    const customerRepo = RepositoryFactory.getCustomerRepository();
    const shopId = config.shopId || "demo_shop";

    for (const mod of config.modules) {
      const moduleStats = { created: 0, skipped: 0, errors: 0 };
      logs.push(`[${new Date().toISOString()}] Starting: ${mod}`);

      try {
        switch (mod) {
          case "categories": {
            const items = SEED_CATEGORIES(shopId);
            for (const item of items) {
              try {
                const existing = await productRepo.getExistingCategories(shopId);
                const exists = existing.some((e: any) => e.name?.toLowerCase() === item.name.toLowerCase());
                if (exists && config.options.skipExisting) {
                  moduleStats.skipped++;
                  continue;
                }
                const id = productRepo.generateCategoryId();
                await productRepo.createCategory({ ...item, id, createdAt: new Date(), updatedAt: new Date() });
                moduleStats.created++;
              } catch (err: any) {
                moduleStats.errors++;
                logs.push(`  ERROR (category ${item.name}): ${err.message}`);
              }
            }
            break;
          }

          case "brands": {
            const items = SEED_BRANDS(shopId);
            for (const item of items) {
              try {
                const existing = await productRepo.getExistingBrands(shopId);
                const exists = existing.some((e: any) => e.name?.toLowerCase() === item.name.toLowerCase());
                if (exists && config.options.skipExisting) {
                  moduleStats.skipped++;
                  continue;
                }
                const id = productRepo.generateBrandId();
                await productRepo.createBrand({ ...item, id, createdAt: new Date(), updatedAt: new Date() });
                moduleStats.created++;
              } catch (err: any) {
                moduleStats.errors++;
                logs.push(`  ERROR (brand ${item.name}): ${err.message}`);
              }
            }
            break;
          }

          case "products": {
            const items = SEED_PRODUCTS(shopId);
            for (const item of items) {
              try {
                const id = productRepo.generateId();
                await productRepo.createProduct(
                  { ...item, id, createdAt: new Date(), updatedAt: new Date() } as any,
                  item.variants
                );
                moduleStats.created++;
              } catch (err: any) {
                moduleStats.errors++;
                logs.push(`  ERROR (product ${item.name}): ${err.message}`);
              }
            }
            break;
          }

          case "customers": {
            const items = SEED_CUSTOMERS(shopId);
            for (const item of items) {
              try {
                const existing = await customerRepo.getCustomersByShop(shopId);
                const exists = existing.some((e: any) => e.mobile === item.mobile);
                if (exists && config.options.skipExisting) {
                  moduleStats.skipped++;
                  continue;
                }
                const id = customerRepo.generateId();
                await customerRepo.createCustomer({
                  ...item,
                  id,
                  createdAt: new Date(),
                } as any);
                moduleStats.created++;
              } catch (err: any) {
                moduleStats.errors++;
                logs.push(`  ERROR (customer ${item.name}): ${err.message}`);
              }
            }
            break;
          }

          case "suppliers": {
            // Suppliers use purchase repository
            const purchaseRepo = RepositoryFactory.getPurchaseRepository();
            const items = SEED_SUPPLIERS(shopId);
            for (const item of items) {
              try {
                const existing = await purchaseRepo.getSuppliers(shopId);
                const exists = existing.some((e: any) => e.name?.toLowerCase() === item.name.toLowerCase());
                if (exists && config.options.skipExisting) {
                  moduleStats.skipped++;
                  continue;
                }
                const id = purchaseRepo.generateSupplierId();
                await purchaseRepo.createSupplier({
                  ...item,
                  id,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                } as any);
                moduleStats.created++;
              } catch (err: any) {
                moduleStats.errors++;
                logs.push(`  ERROR (supplier ${item.name}): ${err.message}`);
              }
            }
            break;
          }

          default:
            logs.push(`  SKIP: module "${mod}" has no seed template yet.`);
            warnings.push(`Module "${mod}" seed template not yet available.`);
            moduleStats.skipped++;
        }
      } catch (err: any) {
        moduleStats.errors++;
        logs.push(`  FATAL ERROR in module ${mod}: ${err.message}`);
      }

      logs.push(`  ✓ ${mod}: created=${moduleStats.created}, skipped=${moduleStats.skipped}, errors=${moduleStats.errors}`);
      report.modules[mod] = moduleStats;
      report.totalCreated += moduleStats.created;
      report.totalSkipped += moduleStats.skipped;
      report.totalErrors += moduleStats.errors;
    }

    const endTime = new Date().toISOString();
    report.endTime = endTime;
    report.durationMs = Date.now() - startMs;
    report.status = report.totalErrors === 0 ? "success" : (report.totalCreated > 0 ? "partial" : "failed");
    report.warnings = warnings;
    report.logs = logs;

    maintenanceReportService.setSeedReport(report);

    await DatabaseLogService.logEvent(
      "switch",
      config.provider,
      report.status === "failed" ? "failed" : "success",
      `Data seeding completed. Provider: ${config.provider}, Type: ${config.seedType}, Created: ${report.totalCreated}, Errors: ${report.totalErrors}`,
      { executedBy: config.requestMeta?.executedBy, ip: config.requestMeta?.ip, modules: config.modules }
    );

    return report;
  }
}

export const dataSeederService = new DataSeederService();
