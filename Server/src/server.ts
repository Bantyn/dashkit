import app from "./app";
import { APP_CONFIG } from "./config/app.config";
import { billingCronService } from "./modules/subscription/billing-cron.service";
import { costAnalyticsWorker } from "./modules/cost-analytics/cost-analytics.worker";
import { campaignWorkerService } from "./modules/promotions/campaign-worker.service";
import { DatabaseConfigService } from "./modules/db-management/db-config.service";
import { initQueueSubsystem, shutdownQueueSubsystem } from "./infrastructure/queue";
import * as os from "os";

const PORT = APP_CONFIG.PORT;

// Detect LAN IP for display
function getLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

import { liveMonitoringService } from "./modules/observability/live-monitoring.service";
import { tailoringMigrationService } from "./modules/tailoring/tailoring-migration.service";

const server = app.listen(Number(PORT), "0.0.0.0", async () => {
  const activeProvider = await DatabaseConfigService.getActiveProvider();

  // Initialize event-driven queue subsystem
  await initQueueSubsystem();

  // Execute automatic database migrations
  await tailoringMigrationService.migrateJobCardsToTailoringJobs().catch(e => console.error("Tailoring migration failed:", e));

  // Start background services & workers
  await billingCronService.start();
  await costAnalyticsWorker.start();
  campaignWorkerService.start();
  liveMonitoringService.init(server, PORT);

  const lanIp = getLanIp();
  const title = " CLOTHIFY BACKEND API ";
  const line = "═".repeat(50);
  const thinLine = "─".repeat(50);

  const hostName = process.env.BACKEND_URL || process.env.HOST || "localhost";
  const wsProtocol = hostName.startsWith("https") ? "wss" : "ws";
  const localUrl = hostName.startsWith("http") ? hostName : `http://${hostName}:${PORT}`;
  const wsUrl = hostName.startsWith("http") ? `${hostName.replace(/^http/, "ws")}/live-monitoring` : `${wsProtocol}://${hostName}:${PORT}/live-monitoring`;

  console.log("");
  console.log(`╔${line}╗`);
  console.log(`║${title.padStart((50 + title.length) / 2).padEnd(50)}║`);
  console.log(`╠${line}╣`);
  console.log(`║  🚀 Local/Host:   ${localUrl.padEnd(31)}║`);
  console.log(`║  🌐 Network:      http://${`${lanIp}:${PORT}`.padEnd(27)}║`);
  console.log(`║  📡 Live Monitor: ${wsUrl.padEnd(31)}║`);
  console.log(`╠${thinLine}╣`);
  console.log(`║  🗄️  DB Provider:  ${activeProvider.toUpperCase().padEnd(27)}║`);
  console.log(`║  ⚙️  Environment:  ${APP_CONFIG.NODE_ENV.padEnd(27)}║`);
  console.log(`║  ⚡ Background:   BullMQ Queues | Event Active    ║`);
  console.log(`╚${line}╝`);
  console.log("");
});

// Graceful shutdown
const handleShutdown = async (signal: string) => {
  console.log(`\n👋 ${signal} received. Shutting down gracefully...`);
  billingCronService.stop();
  costAnalyticsWorker.stop();
  campaignWorkerService.stop();
  await shutdownQueueSubsystem();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
};

// Global process safety handlers for network/gRPC disconnect resilience
process.on("unhandledRejection", (reason: any) => {
  if (reason?.message?.includes("UNAVAILABLE") || reason?.message?.includes("Name resolution failed") || reason?.code === 14) {
    console.warn("⚠️ [Network Warning] Temporary database connection drop (gRPC/DNS):", reason.message || reason);
    return;
  }
  console.error("⚠️ [Unhandled Rejection]:", reason);
});

process.on("uncaughtException", (error: Error) => {
  if (error?.message?.includes("UNAVAILABLE") || error?.message?.includes("Name resolution failed")) {
    console.warn("⚠️ [Network Warning] Temporary database connection drop (gRPC/DNS):", error.message);
    return;
  }
  console.error("❌ [Uncaught Exception]:", error);
});

process.on("SIGTERM", () => void handleShutdown("SIGTERM"));
process.on("SIGINT", () => void handleShutdown("SIGINT"));

export default server;
