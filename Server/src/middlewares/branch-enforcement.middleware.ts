import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { ForbiddenError } from "../shared/utils/errors";
import { asyncHandler } from "../shared/utils/response";
import { db } from "../config/firebase.config";
import { CacheService } from "../infrastructure/cache/cache.service";

const branchCache = new CacheService();

function getModuleFromUrl(url: string, shopId?: string): string | null {
  if (!shopId) return null;
  const cleanUrl = url.split("?")[0];
  const parts = cleanUrl.split("/").filter(Boolean);
  const index = parts.indexOf(shopId);
  if (index === -1) return null;

  const resource = parts[index + 1];
  if (!resource) return null;

  if (resource.startsWith('pos')) return 'pos';
  if (resource.startsWith('orders') || resource.startsWith('sales')) return 'pos';
  if (resource.startsWith('invoices') || resource.startsWith('payments') || resource.startsWith('credit-notes')) return 'invoices';
  if (resource.startsWith('transactions')) return 'transactions';
  if (resource.startsWith('products') || resource.startsWith('categories') || resource.startsWith('reviews')) return 'products';
  if (resource.startsWith('inventory')) return 'inventory';
  if (resource.startsWith('purchases')) return 'purchases';
  if (resource.startsWith('tailoring')) return 'tailoring';
  if (resource.startsWith('customers')) return 'customers';
  if (resource.startsWith('offers')) return 'offers';
  if (resource.startsWith('promotions')) return 'promotions';
  if (resource.startsWith('branches')) return 'branches';
  if (resource.startsWith('shipping')) return 'integrations';
  if (resource.startsWith('staff')) return 'staff';
  if (resource.startsWith('reports')) return 'reports';
  if (resource.startsWith('accounting')) return 'transactions';
  if (resource.startsWith('crm')) return 'customers';
  if (resource.startsWith('analytics')) return 'analytics';
  if (resource.startsWith('website')) return 'website';
  if (resource.startsWith('images')) return 'products';
  if (resource.startsWith('notifications')) return 'promotions';
  if (resource.startsWith('audit')) return 'staff';
  if (resource.startsWith('expenses')) return 'pos';
  if (resource.startsWith('settings')) return 'settings';
  return null;
}

export const enforceBranchModules = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.branchType === "child" && req.branchId && req.shopId) {
      const module = getModuleFromUrl(req.originalUrl || req.url, req.shopId);
      if (module) {
        const cacheKey = `branch:doc:${req.branchId}`;
        let branchData = branchCache.get<any>(cacheKey);
        if (!branchData) {
          const doc = await db.collection("branches").doc(req.branchId).get();
          branchData = doc.exists ? doc.data() : null;
          if (branchData) {
            branchCache.set(cacheKey, branchData, 5 * 60 * 1000); // 5 mins cache
          }
        }
        if (branchData && branchData.allowedModules) {
          if (!branchData.allowedModules.includes(module)) {
            throw new ForbiddenError(
              `Access denied: The "${module}" module is disabled for this branch.`
            );
          }
        }
      }
    }
    next();
  }
);
