export type NotificationType =
  // 🔴 Critical
  | 'stock_out'
  | 'low_stock'
  | 'payment_gateway_failed'
  | 'daily_closing_pending'
  | 'backup_failed'
  | 'subscription_expiring_today'
  | 'shop_suspended_warning'
  | 'gst_config_missing'
  | 'invoice_sequence_error'
  | 'branch_sync_failed'
  // 🟠 Sales
  | 'new_pos_sale'
  | 'new_order'
  | 'cod_order'
  | 'order_cancelled'
  | 'order_returned'
  | 'draft_bill_pending'
  | 'large_order'
  | 'daily_target_achieved'
  // 🟢 Inventory
  | 'new_stock_added'
  | 'purchase_received'
  | 'stock_transfer_completed'
  | 'opening_stock_pending'
  | 'inventory_mismatch'
  | 'barcode_duplicate'
  // 💰 Finance
  | 'payment_received'
  | 'refund_issued'
  | 'supplier_payment_due'
  | 'gst_return_due'
  | 'expense_added'
  | 'bank_reconciliation_pending'
  | 'cash_closing_difference'
  | 'invoice'
  | 'credit_note'
  | 'credit'
  // 👥 Customer
  | 'new_customer'
  | 'customer_birthday'
  | 'vip_customer_visited'
  | 'review'
  | 'negative_review'
  | 'credit_limit_crossed'
  | 'loyalty_redeemed'
  // 👔 Staff
  | 'staff_login'
  | 'staff_checkout'
  | 'staff_late'
  | 'high_performer'
  | 'commission_generated'
  | 'staff_leave_request'
  | 'permission_request'
  // 🌐 Website
  | 'website_down'
  | 'domain_expiring'
  | 'theme_published'
  | 'contact_form_submitted'
  | 'product_out_of_stock_website'
  // 📦 Purchases
  | 'purchase_order_approved'
  | 'goods_received'
  | 'supplier_invoice_pending'
  | 'purchase_return_completed'
  // 📈 Analytics
  | 'sales_target_achieved'
  | 'best_selling_product'
  | 'slow_moving_product'
  | 'revenue_record'
  | 'customer_growth'
  | 'top_branch'
  // 🟣 Subscription
  | 'trial_ending'
  | 'subscription_renewed'
  | 'subscription'
  | 'plan_upgrade_available'
  | 'storage_limit'
  | 'staff_limit_reached'
  | 'product_limit_reached'
  // 🔐 Security
  | 'new_login_device'
  | 'password_changed'
  | 'permission_updated'
  | 'multiple_failed_logins'
  | 'api_key_regenerated'
  // 📣 Promotion
  | 'sms_campaign_completed'
  | 'whatsapp_campaign_delivered'
  | 'email_campaign_failed'
  | 'festival_offer_started'
  | 'coupon_expired'
  | 'info';

export type NotificationCategory =
  | 'critical'
  | 'sales'
  | 'inventory'
  | 'finance'
  | 'customer'
  | 'staff'
  | 'website'
  | 'purchases'
  | 'analytics'
  | 'subscription'
  | 'security'
  | 'promotion';

export interface Notification {
  id: string;
  shopId: string;
  title: string;
  message: string;
  type: NotificationType;
  category?: NotificationCategory;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  status: 'unread' | 'read';
  link?: string;
  referenceId?: string;
  actionLabel?: string;
  actionRoute?: string;
  metadata?: Record<string, any>;
  createdAt: string | Date;
}

