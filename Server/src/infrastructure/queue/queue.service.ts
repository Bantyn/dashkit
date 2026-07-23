export class QueueService {
  enqueue<T>(jobName: string, payload: T) {
    return { jobName, payload, status: "queued" as const };
  }
}

export const queueService = new QueueService();
