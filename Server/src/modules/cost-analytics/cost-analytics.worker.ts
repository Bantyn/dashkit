import { costAnalyticsService } from "./cost-analytics.service";
import { db } from "../../config/firebase.config";

export class CostAnalyticsWorker {
  private interval: NodeJS.Timeout | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly REBUILD_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly DEBOUNCE_DELAY_MS = 5000; // 5 seconds debounce for event invalidations

  async start() {
    // console.log("[Cost Analytics Worker] Starting scheduled background tasks...");
    
    // Shop counters are now bootstrapped via the Master Seeder system.

    // Run initial refresh after server boot (with short delay so server has time to start fully)
    setTimeout(() => {
      this.triggerRebuild("initial_boot");
    }, 10000);

    // Schedule periodic rebuild every 30 minutes
    this.interval = setInterval(() => {
      this.triggerRebuild("scheduled_interval");
    }, this.REBUILD_INTERVAL_MS);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    // console.log("[Cost Analytics Worker] Stopped.");
  }

  /**
   * Debounced invalidate and trigger rebuild.
   * Useful when many mutations occur (e.g. bulk importing products, multiple order edits).
   */
  queueRebuild(reason: string) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.triggerRebuild(`event_invalidated:${reason}`);
    }, this.DEBOUNCE_DELAY_MS);
  }

  private triggerRebuild(reason: string) {
    // console.log(`[Cost Analytics Worker] Rebuilding snapshot. Reason: ${reason}`);
    costAnalyticsService.refreshSnapshotAsync();
  }
}

export const costAnalyticsWorker = new CostAnalyticsWorker();
