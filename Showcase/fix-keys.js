const fs = require('fs');
const file = 'd:/Working/Pending/Clothify/showcase_ui/src/app/pages/pricing/pricing.component.ts';
let content = fs.readFileSync(file, 'utf8');

const mapping = {
  'Product Listing': 'inv_product_listing',
  'Categories': 'inv_categories',
  'Brands Management': 'inv_brands',
  'Product Variants': 'inv_variants',
  'Barcode Support': 'inv_barcode',
  'Stock Tracking': 'inv_stock_tracking',
  'Low Stock Alerts': 'inv_low_stock_alerts',
  'Purchase Orders': 'inv_purchase_orders',
  'Suppliers': 'inv_suppliers',
  'Bulk Product Import': 'inv_bulk_import',
  'Inventory Reports': 'inv_reports',
  'Opening Stock': 'inv_opening_stock',
  'Color-wise Inventory': 'inv_color_inventory',
  'Seasonal Collections': 'seasonal_collections',
  'Stock Transfer': 'inv_stock_transfer',

  'POS Billing': 'sell_pos_billing',
  'Invoices': 'sell_invoices',
  'Credit Notes': 'sell_credit_notes',
  'Draft Orders': 'sell_drafts',
  'Sales Returns': 'sell_returns',
  'Daily Closing': 'sell_daily_closing',
  'Offers & Discounts': 'sell_offers_discounts',
  'Wholesale System': 'wholesale_system',
  'Online Checkout': 'sell_checkout',
  'Online Payments': 'sell_online_payments',
  'Cash on Delivery': 'sell_cod',

  'Storefront Website': 'web_storefront',
  'Website Settings': 'web_settings',
  'Theme Customization': 'web_theme',
  'Custom Pages': 'web_pages',
  'SEO Tools': 'web_seo',
  'Custom Domain': 'web_domain',

  'Customer List': 'cust_list',
  'Purchase History': 'cust_history',
  'Customer Credits': 'cust_credits',
  'Customer Reviews': 'cust_reviews',
  'Online Customers': 'cust_online_customers',

  'Staff Management': 'staff_management',
  'Add Staff Module': 'staff_add',
  'Role Permissions': 'staff_role_permissions',
  'Staff Commission': 'staff_commission',
  'Staff Logs': 'staff_logs',
  'Staff Performance': 'staff_performance',
  'Tailor Job Cards': 'tailor_job_cards',

  'Transactions': 'fin_transactions',
  'Expense Tracking': 'fin_expenses',
  'Payment Management': 'fin_payments',
  'Tax Report': 'fin_tax_report',
  'P&L Report': 'fin_pnl_report',

  'Cash Book': 'acc_cash_book',
  'Bank Book': 'acc_bank_book',
  'Accounts Receivable': 'acc_receivables',
  'Accounts Payable': 'acc_payables',
  'General Ledger': 'acc_ledger',

  'Loyalty Program': 'mktg_loyalty',
  'Birthday Wishes': 'crm_birthday_wishes',
  'Customer Segmentation': 'crm_customer_segmentation',
  'VIP Leaderboard': 'crm_vip_leaderboard',

  'Analytics Dashboard': 'analytics_dashboard',
  'Sales Analytics': 'analytics_sales',
  'Product Analytics': 'analytics_products',
  'Customer Analytics': 'analytics_customers',
  'Branch Analytics': 'analytics_branches',

  'Promotions': 'mktg_promotions',
  'Festival Offers': 'mktg_festival_offers',
  'SMS Campaigns': 'mktg_sms',
  'WhatsApp Campaigns': 'mktg_whatsapp',
  'Message Templates': 'mktg_templates',
  'Loyalty Programme': 'mktg_loyalty',

  'API Access': 'intg_api_access',
  'Invoice Templates': 'intg_invoice_template',

  'Shipping Setup': 'ship_setup',
  'Shiprocket Integration': 'ship_shiprocket',

  'Multi Branch (per Branch)': 'ent_multi_branch',
  'Audit Logs': 'ent_audit_logs'
};

for (const [name, key] of Object.entries(mapping)) {
  const findStr = `{ name: '${name}',`;
  const replaceStr = `{ key: '${key}', name: '${name}',`;
  content = content.replace(findStr, replaceStr);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated features array');
