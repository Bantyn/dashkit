import { Router } from "express";
import {
  getAnalyticsPageData,
  getDashboardStats,
  getReportData,
  getStaffLeaderboard,
} from "../../../modules/analytics/analytics.controller";
import { checkPermission } from "../../../middlewares/role.middleware";
import { checkFeature } from "../../../middlewares/subscription.middleware";
import { FEATURE_KEYS } from "../../../modules/subscription/subscription.constants";

const router = Router();

router.get(
  "/dashboard",
  checkPermission("analytics.view"),
  checkFeature(FEATURE_KEYS.ANALYTICS_DASHBOARD),
  getDashboardStats,
);
router.get(
  "/:shopId/dashboard",
  checkPermission("analytics.view"),
  checkFeature(FEATURE_KEYS.ANALYTICS_DASHBOARD),
  getDashboardStats,
);
router.get(
  "/:shopId/staff-performance",
  checkPermission("analytics.view"),
  checkFeature(FEATURE_KEYS.ANALYTICS_DASHBOARD),
  getStaffLeaderboard,
);
router.get(
  "/:shopId/pages/sales",
  checkPermission("view_sales_analytics"),
  checkFeature(FEATURE_KEYS.ANALYTICS_SALES),
  (req, _res, next) => {
    req.params.pageKey = "sales";
    next();
  },
  getAnalyticsPageData,
);
router.get(
  "/:shopId/pages/customers",
  checkPermission("view_customer_analytics"),
  checkFeature(FEATURE_KEYS.ANALYTICS_CUSTOMERS),
  (req, _res, next) => {
    req.params.pageKey = "customers";
    next();
  },
  getAnalyticsPageData,
);
router.get(
  "/:shopId/pages/products",
  checkPermission("view_product_performance"),
  checkFeature(FEATURE_KEYS.ANALYTICS_PRODUCTS),
  (req, _res, next) => {
    req.params.pageKey = "products";
    next();
  },
  getAnalyticsPageData,
);
router.get(
  "/:shopId/pages/branches",
  checkPermission("view_branch_performance"),
  checkFeature(FEATURE_KEYS.ANALYTICS_BRANCHES),
  (req, _res, next) => {
    req.params.pageKey = "branches";
    next();
  },
  getAnalyticsPageData,
);
router.get(
  "/:shopId/reports/sales",
  checkPermission("reports.sales.view"),
  checkFeature(FEATURE_KEYS.ANALYTICS_SALES),
  (req, _res, next) => {
    req.params.reportKey = "sales";
    next();
  },
  getReportData,
);
router.get(
  "/:shopId/reports/website-sales",
  checkPermission("reports.website_sales.view"),
  checkFeature(FEATURE_KEYS.WEB_STOREFRONT),
  (req, _res, next) => {
    req.params.reportKey = "website-sales";
    next();
  },
  getReportData,
);
router.get(
  "/:shopId/reports/inventory",
  checkPermission("reports.inventory.view"),
  checkFeature(FEATURE_KEYS.INV_REPORTS),
  (req, _res, next) => {
    req.params.reportKey = "inventory";
    next();
  },
  getReportData,
);
router.get(
  "/:shopId/reports/profit-loss",
  checkPermission("reports.profit_loss.view"),
  checkFeature(FEATURE_KEYS.FIN_PNL_REPORT),
  (req, _res, next) => {
    req.params.reportKey = "profit-loss";
    next();
  },
  getReportData,
);
router.get(
  "/:shopId/reports/tax",
  checkPermission("reports.tax.view"),
  checkFeature(FEATURE_KEYS.FIN_TAX_REPORT),
  (req, _res, next) => {
    req.params.reportKey = "tax";
    next();
  },
  getReportData,
);

export default router;
