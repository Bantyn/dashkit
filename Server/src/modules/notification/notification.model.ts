export interface Notification {
  id: string;
  shopId: string;
  title: string;
  message: string;
  type: "low_stock" | "new_order" | "invoice" | "subscription" | "credit_note" | "credit" | "review" | "staff_login" | "info";
  status: "unread" | "read";
  link?: string;
  referenceId?: string;
  createdAt: Date;
}
