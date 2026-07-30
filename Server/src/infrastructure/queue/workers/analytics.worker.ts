import { queueManager } from "../queue.manager";
import { QueueName, AnalyticsJobData } from "../queue.types";
import { costAnalyticsService } from "../../../modules/cost-analytics/cost-analytics.service";

export function initAnalyticsWorker() {
  queueManager.registerWorker<AnalyticsJobData>(
    QueueName.ANALYTICS,
    async (data) => {
      const { reason, shopId } = data;
      costAnalyticsService.refreshSnapshotAsync(`bullmq_worker:${reason || "rebuild"}`);
      return { success: true, shopId, reason };
    },
    2 // Concurrency: limit snapshot rebuild jobs to 2 parallel tasks to protect CPU/memory
  );
}
