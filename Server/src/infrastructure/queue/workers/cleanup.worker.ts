import { queueManager } from "../queue.manager";
import { QueueName, CleanupJobData } from "../queue.types";
import { databaseCleanupWorkerService } from "../../../modules/db-management/cleanup-worker.service";

export function initCleanupWorker() {
  queueManager.registerWorker<CleanupJobData>(
    QueueName.CLEANUP,
    async (data) => {
      console.log(`[Cleanup Queue Worker] Received job action: "${data?.action || "daily_cleanup"}"`);
      const summary = await databaseCleanupWorkerService.executeCleanup(data);
      return summary;
    },
    1 // Concurrency: 1 job at a time for safety
  );
}
