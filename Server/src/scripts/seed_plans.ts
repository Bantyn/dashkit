import { db } from "../config/firebase.config";
import { SubscriptionPlan } from "../modules/subscription-plan/subscription-plan.model";

const now = new Date();

const ALL_FEATURES = [
  "inv_product_listing", "inv_categories", "inv_stock_tracking", "inv_stock_in_out",
  "inv_low_stock_alerts", "inv_purchase_orders", "inv_suppliers", "inv_opening_stock",
  "inv_stock_transfer", "inv_bulk_import", "inv_brands", "inv_variants", "inv_barcode",
  "inv_reports", "inv_color_inventory", "seasonal_collections", "sell_pos_billing",
  "sell_invoices", "sell_returns", "sell_drafts", "sell_daily_closing", "sell_credit_notes",
  "sell_checkout", "sell_cod", "sell_online_payments", "sell_offers_discounts",
  "web_storefront", "web_theme", "web_pages", "web_domain", "web_seo", "web_settings", "web_ai_bg_removal",
  "cust_list", "cust_online_customers", "cust_credits", "cust_history", "cust_reviews",
  "staff_management", "staff_add", "staff_commission", "staff_logs", "staff_performance",
  "staff_role_permissions", "tailor_job_cards", "analytics_dashboard", "analytics_sales",
  "analytics_customers", "analytics_products", "analytics_branches", "mktg_promotions",
  "mktg_festival_offers", "mktg_loyalty", "mktg_sms", "mktg_whatsapp", "mktg_templates",
  "crm_birthday_wishes", "crm_customer_segmentation", "crm_vip_leaderboard",
  "fin_transactions", "fin_expenses", "fin_payments", "fin_pnl_report", "fin_tax_report",
  "acc_cash_book", "acc_bank_book", "acc_ledger", "acc_receivables", "acc_payables",
  "ship_setup", "ship_shiprocket", "ship_tracking", "intg_api_access",
  "intg_payment_gateway", "intg_invoice_template", "wholesale_system", "ent_multi_branch"
];

export const plans: SubscriptionPlan[] = [
  {
    id: "nano",
    code: "NANO",
    name: "Nano",
    description: "For freelance tailors & single users.",
    price: 149,
    monthlyPrice: 149,
    yearlyPrice: 1490,
    currency: "INR",
    features: [
      "inv_product_listing", "sell_pos_billing", "sell_invoices", "cust_list"
    ],
    limits: {
      staff_count: 1,
      branch_count: 1,
      invoices_per_month: 50,
      products_count: 100
    },
    metadata: {
      isUltraSmallBusiness: true
    },
    badge: "Starter",
    targetAudience: "Single tailor / freelancer",
    capabilityLabel: "Basic Billing",
    icon: "user",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    featured: false,
    active: true,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "micro",
    code: "MICRO",
    name: "Micro",
    description: "For tiny shops with basic needs.",
    price: 299,
    monthlyPrice: 299,
    yearlyPrice: 2990,
    currency: "INR",
    features: [
      "inv_product_listing", "inv_stock_tracking", "sell_pos_billing", "sell_invoices",
      "cust_list", "cust_history"
    ],
    limits: {
      staff_count: 2,
      branch_count: 1,
      invoices_per_month: 100,
      products_count: 150
    },
    metadata: {
      isUltraSmallBusiness: true
    },
    targetAudience: "Small shop",
    capabilityLabel: "Inventory Tracking",
    icon: "store",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    featured: false,
    active: true,
    sortOrder: 2,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "mini",
    code: "MINI",
    name: "Mini",
    description: "For growing boutiques looking for an edge.",
    price: 499,
    monthlyPrice: 499,
    yearlyPrice: 4990,
    currency: "INR",
    features: [
      "inv_product_listing", "inv_stock_tracking", "sell_pos_billing", "sell_invoices",
      "cust_list", "cust_history", "web_storefront", "staff_management"
    ],
    limits: {
      staff_count: 3,
      branch_count: 1,
      invoices_per_month: 300,
      products_count: 350
    },
    metadata: {
      isUltraSmallBusiness: true
    },
    targetAudience: "Boutique",
    capabilityLabel: "Storefront included",
    icon: "shopping-bag",
    color: "#ec4899",
    bgColor: "#fce7f3",
    featured: false,
    active: true,
    sortOrder: 3,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "starter",
    code: "STARTER",
    name: "Starter",
    description: "Perfect for established retail stores.",
    price: 799,
    monthlyPrice: 799,
    yearlyPrice: 7990,
    currency: "INR",
    features: [
      ...ALL_FEATURES.filter(f => !f.includes("ent_") && !f.includes("intg_api_access") && !f.includes("wholesale"))
    ],
    limits: {
      staff_count: 5,
      branch_count: 1,
      invoices_per_month: -1,
      products_count: 1000
    },
    metadata: {
      isUltraSmallBusiness: false
    },
    targetAudience: "Established retail shop",
    capabilityLabel: "Unlimited Billing",
    icon: "zap",
    color: "#10b981",
    bgColor: "#d1fae5",
    featured: false,
    active: true,
    sortOrder: 4,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "growth",
    code: "GROWTH",
    name: "Growth",
    description: "Scale your business with advanced tools.",
    price: 1299,
    monthlyPrice: 1299,
    yearlyPrice: 12990,
    currency: "INR",
    features: [
      ...ALL_FEATURES.filter(f => !f.includes("ent_multi_branch"))
    ],
    limits: {
      staff_count: 10,
      branch_count: 2,
      invoices_per_month: -1,
      products_count: 1500
    },
    metadata: {
      isUltraSmallBusiness: false
    },
    badge: "Popular",
    targetAudience: "Growing business",
    capabilityLabel: "Advanced CRM & Integrations",
    icon: "trending-up",
    color: "#3b82f6",
    bgColor: "#eff6ff",
    featured: true,
    active: true,
    sortOrder: 5,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "plus",
    code: "PLUS",
    name: "Plus",
    description: "Multi-location ready with higher limits.",
    price: 1999,
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    currency: "INR",
    features: [
      ...ALL_FEATURES.filter(f => !f.includes("ent_multi_branch"))
    ],
    limits: {
      staff_count: 15,
      branch_count: 3,
      invoices_per_month: -1,
      products_count: -1
    },
    metadata: {
      isUltraSmallBusiness: false
    },
    targetAudience: "Large retailer",
    capabilityLabel: "Extra Staff & Branches",
    icon: "layers",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    featured: false,
    active: true,
    sortOrder: 6,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "pro",
    code: "PRO",
    name: "Pro",
    description: "For high volume stores requiring priority tools.",
    price: 2999,
    monthlyPrice: 2999,
    yearlyPrice: 29990,
    currency: "INR",
    features: [...ALL_FEATURES],
    limits: {
      staff_count: 30,
      branch_count: 5,
      invoices_per_month: -1,
      products_count: -1
    },
    metadata: {
      isUltraSmallBusiness: false
    },
    targetAudience: "Multi-branch business",
    capabilityLabel: "Priority Support & Multi-Branch",
    icon: "star",
    color: "#6366f1",
    bgColor: "#e0e7ff",
    featured: false,
    active: true,
    sortOrder: 7,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "enterprise",
    code: "ENTERPRISE",
    name: "Enterprise",
    description: "Full suite for large multi-branch chains.",
    price: null,
    monthlyPrice: null,
    yearlyPrice: null,
    currency: "INR",
    features: [...ALL_FEATURES],
    limits: {
      staff_count: -1,
      branch_count: -1,
      invoices_per_month: -1,
      products_count: -1
    },
    metadata: {
      isUltraSmallBusiness: false
    },
    targetAudience: "Chains & franchises",
    capabilityLabel: "Dedicated Manager",
    icon: "shield",
    color: "#1f2937",
    bgColor: "#f3f4f6",
    featured: false,
    active: true,
    sortOrder: 8,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "custom",
    code: "CUSTOM",
    name: "Custom Plan",
    description: "Tailored to your specific enterprise needs.",
    price: null,
    monthlyPrice: null,
    yearlyPrice: null,
    currency: "INR",
    features: [...ALL_FEATURES],
    limits: {
      staff_count: -1,
      branch_count: -1,
      invoices_per_month: -1,
      products_count: -1
    },
    isCustom: true,
    metadata: {
      isUltraSmallBusiness: false
    },
    targetAudience: "Special requirements",
    capabilityLabel: "Custom Development",
    icon: "box",
    color: "#000000",
    bgColor: "#f9fafb",
    featured: false,
    active: true,
    sortOrder: 9,
    createdAt: now,
    updatedAt: now
  }
];

async function seedPlans() {
  console.log("[seed:plans] Deleting existing plans...");
  const existingPlans = await db.collection("plans").get();
  
  const batchDelete = db.batch();
  existingPlans.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    // Keep 'trial' if needed, or delete all. User said wipe existing plans.
    batchDelete.delete(doc.ref);
  });
  await batchDelete.commit();

  console.log(`[seed:plans] Inserting ${plans.length} new plans...`);
  const batchInsert = db.batch();
  for (const plan of plans) {
    batchInsert.set(db.collection("plans").doc(plan.id), plan);
  }
  await batchInsert.commit();

  console.log("[seed:plans] Done! Plans successfully seeded.");
}

seedPlans().catch(console.error).finally(() => process.exit(0));
