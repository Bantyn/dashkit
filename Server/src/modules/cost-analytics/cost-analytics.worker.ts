import { queueManager } from "../../infrastructure/queue/queue.manager";
import { QueueName, AnalyticsJobData } from "../../infrastructure/queue/queue.types";
import { costAnalyticsService } from "./cost-analytics.service";

export class CostAnalyticsWorker {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY_MS = 5000; // 5 seconds debounce for event invalidations

  async start() {
    console.log("⚡ [Cost Analytics Worker] Initialized in Event-Driven Queue Mode.");
    // Run initial boot rebuild asynchronously via queue if needed
    setTimeout(() => {
      void this.triggerRebuild("initial_boot");
    }, 10000);
  }

  stop() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Debounced invalidate and trigger rebuild via BullMQ event queue.
   * Useful when many mutations occur (e.g. bulk importing products, multiple order edits).
   */
  queueRebuild(reason: string, shopId?: string) {
    if (costAnalyticsService.isCooldownActive()) {
      console.log(`[Analytics Snapshot] Skipped queueing. Reason: Cooldown Active (trigger: ${reason})`);
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      void this.triggerRebuild(`event_invalidated:${reason}`, shopId);
    }, this.DEBOUNCE_DELAY_MS);
  }

  public async triggerRebuild(reason: string, shopId?: string) {
    if (costAnalyticsService.isCooldownActive()) {
      console.log(`[Analytics Snapshot] Skipped. Reason: Cooldown Active (trigger: ${reason})`);
      return;
    }

    const jobData: AnalyticsJobData = {
      reason,
      shopId,
      timestamp: Date.now()
    };

    // Use deterministic Job ID to deduplicate pending/waiting BullMQ jobs
    const jobId = "analytics_snapshot_rebuild_global";

    console.log(`[Analytics Snapshot] Enqueueing BullMQ job "${jobId}" (reason: ${reason})`);
    await queueManager.addJob<AnalyticsJobData>(
      QueueName.ANALYTICS,
      "rebuild-cost-snapshot",
      jobData,
      {
        jobId
      }
    );
  }
}

export const costAnalyticsWorker = new CostAnalyticsWorker();
