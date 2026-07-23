export type AdminNotificationCategory =
  | "critical"
  | "high_priority"
  | "business"
  | "shops"
  | "platform"
  | "security"
  | "cost"
  | "database"
  | "system_update";

export type AdminNotificationPriority = "critical" | "high" | "medium" | "low";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  category: AdminNotificationCategory;
  priority: AdminNotificationPriority;
  status: "unread" | "read";
  icon: string;
  actionLink?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date | null;
}

export const CATEGORY_META: Record<
  AdminNotificationCategory,
  { icon: string; label: string; color: string; priority: AdminNotificationPriority }
> = {
  critical:       { icon: "🔴", label: "Critical",        color: "#ef4444", priority: "critical" },
  high_priority:  { icon: "🟠", label: "High Priority",   color: "#f97316", priority: "high" },
  business:       { icon: "💰", label: "Business",        color: "#3b82f6", priority: "medium" },
  shops:          { icon: "🟢", label: "Shops",           color: "#22c55e", priority: "medium" },
  platform:       { icon: "🟣", label: "Platform",        color: "#a855f7", priority: "high" },
  security:       { icon: "🟡", label: "Security",        color: "#eab308", priority: "high" },
  cost:           { icon: "🟤", label: "Cost",            color: "#92400e", priority: "medium" },
  database:       { icon: "🟧", label: "Database",        color: "#ea580c", priority: "medium" },
  system_update:  { icon: "🔵", label: "System Update",  color: "#0ea5e9", priority: "low" },
};
