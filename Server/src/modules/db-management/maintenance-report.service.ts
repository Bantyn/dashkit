/**
 * MaintenanceReportService
 * In-memory store for last seeding and cleanup reports.
 * Reports survive across requests within a process lifecycle.
 */

export interface SeedingReport {
  status: "success" | "partial" | "failed" | "running";
  startTime: string;
  endTime?: string;
  durationMs?: number;
  provider: string;
  environment: string;
  seedType: string;
  modules: Record<string, { created: number; skipped: number; errors: number }>;
  totalCreated: number;
  totalSkipped: number;
  totalErrors: number;
  warnings: string[];
  logs: string[];
  executedBy: string;
  ip: string;
}

export interface CleanupReport {
  status: "success" | "partial" | "failed" | "running";
  startTime: string;
  endTime?: string;
  durationMs?: number;
  provider: string;
  modules: Record<string, { deleted: number; errors: number }>;
  totalDeleted: number;
  totalErrors: number;
  structureVerification: Record<string, boolean>;
  warnings: string[];
  logs: string[];
  executedBy: string;
  ip: string;
}

class MaintenanceReportService {
  private lastSeedReport: SeedingReport | null = null;
  private lastCleanupReport: CleanupReport | null = null;

  setSeedReport(report: SeedingReport): void {
    this.lastSeedReport = report;
  }

  getSeedReport(): SeedingReport | null {
    return this.lastSeedReport;
  }

  setCleanupReport(report: CleanupReport): void {
    this.lastCleanupReport = report;
  }

  getCleanupReport(): CleanupReport | null {
    return this.lastCleanupReport;
  }

  clearReports(): void {
    this.lastSeedReport = null;
    this.lastCleanupReport = null;
  }
}

// Singleton
export const maintenanceReportService = new MaintenanceReportService();
