import { db } from '../infrastructure/firebase/firebase.client';

async function run() {
  const trialPlan = {
    id: 'trial',
    code: 'trial',
    name: '5-Day Free Trial',
    description: 'Full access to all Pro features for 5 days.',
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'INR',
    features: [
      'inv_product_listing', 'inv_categories', 'inv_stock_tracking', 'inv_stock_in_out',
      'inv_low_stock_alerts', 'inv_purchase_orders', 'inv_suppliers', 'inv_opening_stock',
      'inv_stock_transfer', 'inv_bulk_import', 'inv_brands', 'inv_variants', 'inv_barcode',
      'inv_reports', 'inv_color_inventory', 'seasonal_collections', 'sell_pos_billing',
      'sell_invoices', 'sell_returns', 'sell_drafts', 'sell_daily_closing', 'sell_credit_notes',
      'sell_checkout', 'sell_cod', 'sell_online_payments', 'sell_offers_discounts',
      'web_storefront', 'web_theme', 'web_pages', 'web_domain', 'web_seo', 'web_settings',
      'cust_list', 'cust_online_customers', 'cust_credits', 'cust_history', 'cust_reviews',
      'staff_management', 'staff_add', 'staff_commission', 'staff_logs', 'staff_performance',
      'staff_role_permissions', 'tailor_job_cards', 'analytics_dashboard', 'analytics_sales',
      'analytics_customers', 'analytics_products', 'analytics_branches', 'mktg_promotions',
      'mktg_festival_offers', 'mktg_loyalty', 'mktg_sms', 'mktg_whatsapp', 'mktg_templates',
      'crm_birthday_wishes', 'crm_customer_segmentation', 'crm_vip_leaderboard',
      'fin_transactions', 'fin_expenses', 'fin_payments', 'fin_pnl_report', 'fin_tax_report',
      'acc_cash_book', 'acc_bank_book', 'acc_ledger', 'acc_receivables', 'acc_payables',
      'ship_setup', 'ship_shiprocket', 'ship_tracking', 'intg_api_access',
      'intg_payment_gateway', 'intg_invoice_template', 'wholesale_system', 'ent_multi_branch'
    ],
    limits: {
      orders_per_month: 100,
      sms_per_month: 50,
      staff_count: 1,
      branch_count: 1,
      products_count: 100,
      invoices_per_month: 100
    },
    badge: 'Trial',
    targetAudience: 'New shop owners',
    capabilityLabel: 'Full Access',
    icon: 'clock',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    featured: false,
    active: true,
    sortOrder: 1,
    limitations: [],
    metadata: { autoPayEligible: false },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection('plans').doc('trial').set(trialPlan, { merge: true });
  console.log('Trial plan seeded directly into DB');
  process.exit(0);
}

run().catch(console.error);
