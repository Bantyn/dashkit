import { Queue, Worker, Job, QueueOptions, WorkerOptions } from "bullmq";
import Redis from "ioredis";
import EventEmitter from "events";
import { getRedisConnectionOptions } from "../../config/redis.config";
import { QueueName } from "./queue.types";

export class QueueManager {
  private static instance: QueueManager;
  private redisClient: Redis | null = null;
  private isRedisAvailable: boolean = false;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private fallbackEmitter: EventEmitter = new EventEmitter();
  private fallbackHandlers: Map<string, (data: any) => Promise<any>> = new Map();
  private initialized: boolean = false;

  private constructor() {
    this.fallbackEmitter.setMaxListeners(50);
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /**
   * Test Redis connection and initialize queue subsystem
   */
  public async init(): Promise<boolean> {
    if (this.initialized) return this.isRedisAvailable;

    const redisOpts = getRedisConnectionOptions();
    
    try {
      this.redisClient = new Redis({
        ...redisOpts,
        lazyConnect: true,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false
      });

      // Timeout after 3 seconds if Redis server is down
      const connectPromise = this.redisClient.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis connection timeout")), 3000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      
      this.isRedisAvailable = true;
      console.log("✅ [QueueManager] Redis connection established. BullMQ distributed queues enabled.");
    } catch (err: any) {
      this.isRedisAvailable = false;
      if (this.redisClient) {
        this.redisClient.disconnect();
        this.redisClient = null;
      }
      console.warn(`⚠️ [QueueManager] Redis unavailable (${err.message}). Activating in-process asynchronous Queue Fallback.`);
    }

    this.initialized = true;
    return this.isRedisAvailable;
  }

  /**
   * Get or create a BullMQ Queue instance
   */
  public getQueue(queueName: QueueName | string): Queue | null {
    if (!this.isRedisAvailable) return null;

    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: getRedisConnectionOptions(),
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 2000
          },
          removeOnComplete: { age: 3600, count: 100 },  // Keep last 100 completed jobs (1 hour)
          removeOnFail: { age: 172800, count: 200 }     // Keep last 200 failed jobs (48 hours)
        }
      });

      queue.on("error", (err) => {
        console.error(`[QueueManager] Error in queue "${queueName}":`, err.message);
      });

      this.queues.set(queueName, queue);
    }

    return this.queues.get(queueName)!;
  }

  /**
   * Enqueue a job into specified Queue (or in-process fallback)
   */
  public async addJob<T = any>(
    queueName: QueueName | string,
    jobName: string,
    data: T,
    opts: { jobId?: string; delay?: number; priority?: number } = {}
  ): Promise<{ success: boolean; jobId?: string }> {
    if (!this.initialized) {
      await this.init();
    }

    const deduplicationId = opts.jobId || (data as any)?.deduplicationId;

    if (this.isRedisAvailable) {
      try {
        const queue = this.getQueue(queueName);
        if (queue) {
          const job = await queue.add(jobName, data, {
            jobId: deduplicationId,
            delay: opts.delay,
            priority: opts.priority
          });
          return { success: true, jobId: job.id };
        }
      } catch (err: any) {
        console.error(`[QueueManager] Error adding job to BullMQ queue "${queueName}":`, err.message);
      }
    }

    // Fallback mode execution
    const fallbackId = deduplicationId || `${queueName}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const delay = opts.delay || 0;

    const executeFallback = async () => {
      const handler = this.fallbackHandlers.get(queueName);
      if (handler) {
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
          try {
            attempts++;
            await handler(data);
            break;
          } catch (err: any) {
            console.error(`[QueueManager Fallback] Worker "${queueName}" attempt ${attempts} failed:`, err.message);
            if (attempts < maxAttempts) {
              await new Promise(res => setTimeout(res, attempts * 2000));
            }
          }
        }
      } else {
        console.warn(`[QueueManager Fallback] No worker registered for queue "${queueName}"`);
      }
    };

    if (delay > 0) {
      setTimeout(executeFallback, delay);
    } else {
      setImmediate(executeFallback);
    }

    return { success: true, jobId: fallbackId };
  }

  /**
   * Register a Worker processor for a queue
   */
  public registerWorker<T = any, R = any>(
    queueName: QueueName | string,
    processor: (data: T, job?: Job<T, R>) => Promise<R>,
    concurrency: number = 5
  ): Worker | null {
    // Register fallback handler
    this.fallbackHandlers.set(queueName, (data: T) => processor(data));

    if (!this.isRedisAvailable) return null;

    if (!this.workers.has(queueName)) {
      const worker = new Worker<T, R>(
        queueName,
        async (job: Job<T, R>) => {
          return await processor(job.data, job);
        },
        {
          connection: getRedisConnectionOptions(),
          concurrency
        }
      );

      worker.on("completed", (job) => {
        // console.log(`[Queue Worker] Job ${job.id} on queue "${queueName}" completed successfully.`);
      });

      worker.on("failed", (job, err) => {
        console.error(`❌ [Queue Worker] Job ${job?.id} on queue "${queueName}" failed:`, err.message);
      });

      worker.on("error", (err) => {
        console.error(`[Queue Worker] Error on worker "${queueName}":`, err.message);
      });

      this.workers.set(queueName, worker);
    }

    return this.workers.get(queueName)!;
  }

  /**
   * Trim completed and failed jobs from all active queues to prevent Redis RAM bloat
   */
  public async trimQueues(): Promise<{ trimmedQueues: number; status: string }> {
    if (!this.isRedisAvailable || this.queues.size === 0) {
      return { trimmedQueues: 0, status: "Redis queue unavailable or empty" };
    }

    let trimmedQueues = 0;
    for (const [name, queue] of this.queues.entries()) {
      try {
        // Clean completed jobs older than 1 hour (3600s)
        await queue.clean(3600 * 1000, 1000, "completed");
        // Clean failed jobs older than 48 hours (172800s)
        await queue.clean(172800 * 1000, 1000, "failed");
        trimmedQueues++;
      } catch (err: any) {
        console.warn(`[QueueManager] Failed to trim queue "${name}":`, err.message);
      }
    }

    console.log(`🧹 [QueueManager] Trimmed Redis job memory for ${trimmedQueues} active queues.`);
    return { trimmedQueues, status: "success" };
  }

  /**
   * Graceful shutdown of all queues and workers
   */
  public async shutdownAll(): Promise<void> {
    console.log("👋 [QueueManager] Shutting down all workers and queues...");

    for (const [name, worker] of this.workers.entries()) {
      try {
        await worker.close();
        console.log(`✅ [QueueManager] Closed worker for queue "${name}"`);
      } catch (err: any) {
        console.error(`[QueueManager] Error closing worker "${name}":`, err.message);
      }
    }
    this.workers.clear();

    for (const [name, queue] of this.queues.entries()) {
      try {
        await queue.close();
        console.log(`✅ [QueueManager] Closed queue "${name}"`);
      } catch (err: any) {
        console.error(`[QueueManager] Error closing queue "${name}":`, err.message);
      }
    }
    this.queues.clear();

    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch {
        // Ignore disconnect error
      }
      this.redisClient = null;
    }

    this.initialized = false;
    this.isRedisAvailable = false;
  }
}

export const queueManager = QueueManager.getInstance();
