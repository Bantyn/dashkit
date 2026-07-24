export type SecurityEventType =
  | "FAILED_LOGIN"
  | "TEMPORARY_LOCK_APPLIED"
  | "LOCK_EXPIRED"
  | "SUCCESSFUL_LOGIN"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_REACTIVATED";

export interface AuditLog {
  id?: string;
  shopId?: string;
  email: string;
  userId?: string;
  ipAddress: string;
  device: string;
  browser: string;
  operatingSystem: string;
  timestamp: Date | string;
  eventType: SecurityEventType;
  failureReason?: string;
  details?: Record<string, any>;
}
