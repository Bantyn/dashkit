import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { DB_CONFIG } from "../../application/repositories/providers/db-provider.config";

export interface LiveRequestLog {
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  shopId: string;
  branchId: string;
  supabaseReads: number;
  supabaseWrites: number;
  firestoreReads: number;
  firestoreWrites: number;
  cacheHits: number;
  cacheMisses: number;
  databaseProvider: string;
  success: boolean;
}

export class LiveMonitoringService {
  private static instance: LiveMonitoringService;
  private wss: WebSocketServer | null = null;
  private buffer: LiveRequestLog[] = [];
  private maxBufferSize = 500;

  // Real-time rolling counters for active stats
  private activeRequests = 0;
  private requestCountInWindow = 0;
  private responseTimesInWindow: number[] = [];
  private errorCountInWindow = 0;
  private successCountInWindow = 0;

  // DB operations in window
  private supabaseReadsInWindow = 0;
  private supabaseWritesInWindow = 0;
  private firestoreReadsInWindow = 0;
  private firestoreWritesInWindow = 0;
  private cacheHitsInWindow = 0;
  private cacheMissesInWindow = 0;

  private cpuPercent = 0;
  private lastCpuUsage = process.cpuUsage();
  private lastCpuTime = Date.now();

  private constructor() {
    this.startMetricsInterval();
  }

  static getInstance(): LiveMonitoringService {
    if (!LiveMonitoringService.instance) {
      LiveMonitoringService.instance = new LiveMonitoringService();
    }
    return LiveMonitoringService.instance;
  }

  init(server: Server, port?: number | string) {
    this.wss = new WebSocketServer({ 
      server, 
      path: "/live-monitoring" 
    });

    this.wss.on("connection", (ws: WebSocket) => {
      // Send initial snapshot of last 500 requests
      ws.send(JSON.stringify({
        type: "initial",
        data: {
          recentRequests: this.buffer,
          metrics: this.getCurrentMetrics()
        }
      }));
    });
  }

  recordRequest(log: LiveRequestLog) {
    // 1. Manage circular buffer
    this.buffer.unshift(log);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.pop(); // Remove oldest (FIFO)
    }

    // 2. Update window statistics
    this.requestCountInWindow++;
    this.responseTimesInWindow.push(log.responseTime);
    if (this.responseTimesInWindow.length > 500) this.responseTimesInWindow.shift();

    if (log.success) {
      this.successCountInWindow++;
    } else {
      this.errorCountInWindow++;
    }

    this.supabaseReadsInWindow += log.supabaseReads;
    this.supabaseWritesInWindow += log.supabaseWrites;
    this.firestoreReadsInWindow += log.firestoreReads;
    this.firestoreWritesInWindow += log.firestoreWrites;
    this.cacheHitsInWindow += log.cacheHits;
    this.cacheMissesInWindow += log.cacheMisses;

    // 3. Broadcast new request event to active WS clients
    if (this.wss) {
      const payload = JSON.stringify({
        type: "request",
        data: log
      });
      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  }

  incrementActiveRequests() {
    this.activeRequests++;
    this.broadcastActiveRequests();
  }

  decrementActiveRequests() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.broadcastActiveRequests();
  }

  private broadcastActiveRequests() {
    if (this.wss) {
      const payload = JSON.stringify({
        type: "activeRequests",
        data: { activeRequests: this.activeRequests }
      });
      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  }

  private getCurrentMetrics() {
    const memory = process.memoryUsage();
    const uptime = Math.round(process.uptime());

    // Calculate P95 latency
    const sortedLatency = [...this.responseTimesInWindow].sort((a, b) => a - b);
    const p95Index = Math.ceil(0.95 * sortedLatency.length) - 1;
    const p95Latency = sortedLatency.length > 0 ? sortedLatency[Math.max(0, p95Index)] : 0;

    const avgLatency = this.responseTimesInWindow.length > 0
      ? Math.round(this.responseTimesInWindow.reduce((a, b) => a + b, 0) / this.responseTimesInWindow.length)
      : 0;

    const totalRequests = this.successCountInWindow + this.errorCountInWindow;
    const successRate = totalRequests > 0 ? Number(((this.successCountInWindow / totalRequests) * 100).toFixed(1)) : 100;
    const errorRate = totalRequests > 0 ? Number(((this.errorCountInWindow / totalRequests) * 100).toFixed(1)) : 0;

    const totalCache = this.cacheHitsInWindow + this.cacheMissesInWindow;
    const cacheHitRate = totalCache > 0 ? Number(((this.cacheHitsInWindow / totalCache) * 100).toFixed(1)) : 100;

    return {
      activeRequests: this.activeRequests,
      requestsPerSecond: Number((this.requestCountInWindow / 1).toFixed(1)), // Window is 1s
      avgResponseTime: avgLatency,
      p95ResponseTime: p95Latency,
      successRate,
      errorRate,
      memoryUsageMB: Math.round(memory.rss / 1024 / 1024),
      serverUptime: uptime,

      // Database
      supabaseReads: this.supabaseReadsInWindow,
      supabaseWrites: this.supabaseWritesInWindow,
      firestoreReads: this.firestoreReadsInWindow,
      firestoreWrites: this.firestoreWritesInWindow,
      cacheHitRate,
    };
  }

  private startMetricsInterval() {
    // 1s interval to broadcast periodic metrics and calculate rates
    setInterval(() => {
      // Calculate CPU Usage
      const cpuUsage = process.cpuUsage(this.lastCpuUsage);
      const cpuTime = Date.now() - this.lastCpuTime;
      this.lastCpuUsage = process.cpuUsage();
      this.lastCpuTime = Date.now();
      const totalUsage = cpuUsage.user + cpuUsage.system;
      this.cpuPercent = Math.min(100, Math.round((totalUsage / 1000 / cpuTime) * 100));

      if (this.wss && this.wss.clients.size > 0) {
        const payload = JSON.stringify({
          type: "metrics",
          data: {
            ...this.getCurrentMetrics(),
            cpuUsage: this.cpuPercent
          }
        });
        this.wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      }

      // Reset per-second window values
      this.requestCountInWindow = 0;
      this.supabaseReadsInWindow = 0;
      this.supabaseWritesInWindow = 0;
      this.firestoreReadsInWindow = 0;
      this.firestoreWritesInWindow = 0;
      this.cacheHitsInWindow = 0;
      this.cacheMissesInWindow = 0;
      this.successCountInWindow = 0;
      this.errorCountInWindow = 0;
    }, 1000).unref();
  }
}

export const liveMonitoringService = LiveMonitoringService.getInstance();
