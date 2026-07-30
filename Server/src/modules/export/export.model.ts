import { z } from 'zod';

export const ExportFormatEnum = z.enum(['excel', 'csv', 'pdf', 'json', 'zip']);
export type ExportFormat = z.infer<typeof ExportFormatEnum>;

export const ExportStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed']);
export type ExportStatus = z.infer<typeof ExportStatusEnum>;

export interface ExportFilters {
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
  shopId?: string;
  plan?: string;
  paymentStatus?: string;
  category?: string;
  module?: string;
}

export interface ExportHistoryRecord {
  id?: string;
  name: string;
  module: string; // e.g. 'dashboard', 'sales', 'financial', 'compliance', 'subscription', 'shops', 'users', 'invoices', 'orders', 'expenses'
  format: ExportFormat;
  requestedBy: string; // User ID
  requestedByName?: string;
  requestedTime: any; // Firestore Timestamp
  completedTime?: any;
  duration?: string;
  status: ExportStatus;
  fileSize?: string;
  downloadCount: number;
  downloadUrl?: string;
  errorMessage?: string;
  filters?: ExportFilters;
  columns?: string[];
}

export const ExportHistorySchema = z.object({
  name: z.string().optional(),
  module: z.string(),
  format: ExportFormatEnum,
  requestedBy: z.string(),
  requestedByName: z.string().optional(),
  requestedTime: z.any().optional(),
  completedTime: z.any().optional(),
  duration: z.string().optional(),
  status: ExportStatusEnum.optional().default('pending'),
  fileSize: z.string().optional(),
  downloadCount: z.number().default(0),
  downloadUrl: z.string().optional(),
  errorMessage: z.string().optional(),
  filters: z.any().optional(),
  columns: z.array(z.string()).optional(),
});
