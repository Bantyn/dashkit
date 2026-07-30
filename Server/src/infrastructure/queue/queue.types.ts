export enum QueueName {
  CAMPAIGN = "campaign-queue",
  NOTIFICATION = "notification-queue",
  ANALYTICS = "analytics-queue",
  BILLING = "billing-queue",
  CLEANUP = "cleanup-queue"
}

export interface CampaignJobData {
  campaignId: string;
  shopId: string;
  type: "sms" | "whatsapp" | string;
  recipient: string;
  content: string;
  msgId: string;
  deduplicationId?: string;
}

export interface NotificationJobData {
  shopId: string;
  channel: "email" | "sms" | "whatsapp" | "push" | string;
  recipient: string;
  content?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
  deduplicationId?: string;
}

export interface AnalyticsJobData {
  shopId?: string;
  reason: string;
  timestamp: number;
}

export interface BillingJobData {
  action: "check_trials" | "check_payments" | "storage_validation";
  timestamp: number;
}

export interface CleanupJobData {
  action: "daily_cleanup" | "manual_cleanup";
  dryRun?: boolean;
  retentionDays?: {
    notification_logs?: number;
    activity_logs?: number;
    audit_logs?: number;
  };
  batchSize?: number;
  timestamp?: number;
}

export interface CleanupJobSummary {
  success: boolean;
  dryRun: boolean;
  startTime: string;
  endTime: string;
  durationMs: number;
  details: {
    notification_logs: { scanned: number; deleted: number; cutoffDate: string };
    activity_logs: { scanned: number; deleted: number; cutoffDate: string };
    audit_logs: { scanned: number; deleted: number; cutoffDate: string };
  };
  totalDeleted: number;
  errors: string[];
}

export interface QueueJobResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}
