import { Request, Response } from "express";
import { asyncHandler, sendError, sendSuccess } from "../../shared/utils/response";
import { paymentService } from "../subscription/payment.service";
import { subscriptionService } from "../subscription/subscription.service";

const FEATURE_ADDON_CATALOG: Record<string, { name: string; defaultPrice: number }> = {
  acc_receivables: { name: "Accounts Receivable", defaultPrice: 79 },
  acc_payables:    { name: "Accounts Payable",    defaultPrice: 79 },
  acc_ledger:      { name: "General Ledger",       defaultPrice: 99 },
  acc_cash_book:   { name: "Cash Book",            defaultPrice: 49 },
  acc_bank_book:   { name: "Bank Book",            defaultPrice: 49 },
  analytics_sales: { name: "Sales Analytics",      defaultPrice: 79 },
  analytics_products: { name: "Product Analytics", defaultPrice: 79 },
  analytics_customers: { name: "Customer Analytics", defaultPrice: 79 },
  crm_birthday_wishes: { name: "Birthday Wishes", defaultPrice: 39 },
  crm_customer_segmentation: { name: "Customer Segmentation", defaultPrice: 79 },
  crm_vip_leaderboard: { name: "VIP Leaderboard", defaultPrice: 49 },
  mktg_sms:        { name: "SMS Campaigns",        defaultPrice: 149 },
  mktg_whatsapp:   { name: "WhatsApp Campaigns",   defaultPrice: 199 },
  mktg_loyalty:    { name: "Loyalty Programme",     defaultPrice: 99 },
  intg_api_access: { name: "API Access",            defaultPrice: 299 },
  ship_shiprocket: { name: "Shiprocket Integration",defaultPrice: 99 },
  tailor_job_cards:{ name: "Tailor Job Cards",      defaultPrice: 149 },
  wholesale_system:{ name: "Wholesale System",      defaultPrice: 149 },
  web_storefront:  { name: "Storefront Website",    defaultPrice: 149 },
  web_theme:       { name: "Theme Customization",   defaultPrice: 49 },
  web_seo:         { name: "SEO Tools",             defaultPrice: 49 },
  sell_offline_pos_counters: { name: "Offline POS Counters", defaultPrice: 299 },
};

const LIMIT_ADDON_CATALOG: Record<string, { name: string; pricePerUnit: number }> = {
  staff_count:        { name: "Extra Staff Member",  pricePerUnit: 199 },
  branch_count:       { name: "Extra Branch",        pricePerUnit: 500 },
  invoices_per_month: { name: "Extra 500 Invoices/Month", pricePerUnit: 199 },
  products_count:     { name: "Extra 1000 Products", pricePerUnit: 99 },
  offline_pos_counters_count: { name: "Extra POS Counter Device", pricePerUnit: 299 },
};

/**
 * GET /api/v1/admin/shops/:shopId/addons
 * List all subscription items (add-ons) for a shop.
 */
export const listShopAddons = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const addons = await subscriptionService.getActiveAddons(shopId);
  return sendSuccess(res, addons, "Add-ons fetched");
});

/**
 * GET /api/v1/admin/shops/:shopId/addons/catalog
 * Return the available add-on catalog with default prices.
 */
export const getAddonCatalog = asyncHandler(async (_req: Request, res: Response) => {
  const features = Object.entries(FEATURE_ADDON_CATALOG).map(([key, val]) => ({
    key, ...val, type: "feature_addon",
  }));
  const limits = Object.entries(LIMIT_ADDON_CATALOG).map(([key, val]) => ({
    key, ...val, type: "limit_addon",
  }));
  return sendSuccess(res, { features, limits }, "Add-on catalog fetched");
});

/**
 * POST /api/v1/admin/shops/:shopId/addons
 * Create an add-on, generate proration, generate Razorpay payment link.
 * Body: { itemKey, itemType, price?, quantity?, notes? }
 */
export const createShopAddon = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const adminId = (req as any).user?.uid;
  const { itemKey, itemType, price, quantity, notes } = req.body;

  if (!itemKey || !itemType) {
    return sendError(res, "itemKey and itemType are required", 400);
  }
  if (!["feature_addon", "limit_addon"].includes(itemType)) {
    return sendError(res, "itemType must be 'feature_addon' or 'limit_addon'", 400);
  }

  // Lookup catalog for name and default price
  let name: string;
  let finalPrice: number;

  if (itemType === "feature_addon") {
    const catalog = FEATURE_ADDON_CATALOG[itemKey];
    if (!catalog) return sendError(res, `Unknown feature key: ${itemKey}`, 400);
    name = catalog.name;
    finalPrice = price ?? catalog.defaultPrice;
  } else {
    const catalog = LIMIT_ADDON_CATALOG[itemKey];
    if (!catalog) return sendError(res, `Unknown limit key: ${itemKey}`, 400);
    name = catalog.name;
    finalPrice = price ?? catalog.pricePerUnit;
  }

  try {
    const result = await paymentService.createAddonPaymentLink({
      shopId,
      itemKey,
      itemType,
      name,
      price: finalPrice,
      quantity: quantity || 1,
      adminId,
      notes,
    });
    return sendSuccess(res, result, "Add-on payment link generated. Awaiting customer payment.");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to create add-on", 500);
  }
});

/**
 * POST /api/v1/admin/shops/:shopId/addons/:itemId/cancel
 * Cancel an active add-on. Removes from shop features/limits immediately.
 */
export const cancelShopAddon = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const itemId = String(req.params.itemId);
  const adminId = (req as any).user?.uid;

  try {
    const result = await paymentService.cancelAddon(shopId, itemId, adminId);
    return sendSuccess(res, result, "Add-on cancelled successfully");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to cancel add-on", 500);
  }
});

/**
 * POST /api/v1/admin/shops/:shopId/addons/:itemId/activate
 * Manually activate an add-on item and mark payment completed.
 */
export const activateShopAddon = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const itemId = String(req.params.itemId);
  const adminId = (req as any).user?.uid;

  try {
    const result = await paymentService.activateAddon(shopId, itemId, adminId);
    return sendSuccess(res, result, "Add-on activated successfully");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to activate add-on", 500);
  }
});

/**
 * GET /api/v1/admin/shops/:shopId/upcoming-invoice
 * Preview the next invoice: base plan + all active recurring add-ons.
 */
export const getUpcomingInvoice = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  try {
    const invoice = await subscriptionService.getUpcomingInvoice(shopId);
    return sendSuccess(res, invoice, "Upcoming invoice computed");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to compute upcoming invoice", 500);
  }
});

/**
 * GET /api/v1/admin/shops/:shopId/addons/billing-transactions
 * List billing transactions for the shop.
 */
export const getBillingTransactions = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  try {
    const transactions = await paymentService.getShopBillingTransactions(shopId);
    return sendSuccess(res, transactions, "Billing transactions fetched");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to fetch transactions", 500);
  }
});
