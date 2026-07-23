import * as dotenv from "dotenv";
dotenv.config({ quiet: true } as any);

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import "./config/firebase.config"; // Auto-initializes Firebase
import { DB_CONFIG } from "./application/repositories/providers/db-provider.config";
import { DatabaseConfigService } from "./modules/db-management/db-config.service";

// Load active DB provider config on startup asynchronously
DatabaseConfigService.getActiveProvider().then(provider => {
  DB_CONFIG.PROVIDER = provider as any;
  // console.log(`[Database] Dynamic DB provider loaded: ${provider}`);
}).catch(err => {
  console.error("Failed to load active db provider on startup", err);
});

import { APP_CONFIG } from "./config/app.config";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { registerPublicApiRoutes } from "./apps/public-api/routes";
import { registerAdminApiRoutes } from "./apps/admin-api/routes";
import { registerInternalRoutes } from "./apps/internal/routes";

// Create Express app
const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: APP_CONFIG.CORS_ORIGINS,
    credentials: true,
  }),
);

// Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check — enhanced for LAN/network diagnostics
app.get("/health", (req, res) => {
  const os = require("os");
  const interfaces = os.networkInterfaces();
  const lanIps: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of (interfaces[name] || [])) {
      if (iface.family === "IPv4" && !iface.internal) {
        lanIps.push(iface.address);
      }
    }
  }
  const port = APP_CONFIG.PORT;
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: APP_CONFIG.NODE_ENV,
    version: "1.0.0",
    network: {
      local: `http://localhost:${port}`,
      lan: lanIps.map(ip => `http://${ip}:${port}`),
    },
    services: {
      firebase: "connected",
      server: "running",
    },
    ports: {
      backend: port,
      shopDashboard: 4200,
      adminDashboard: 4201,
      showcase: 4202,
    }
  });
});

// API Routes
app.get("/api/v1", (req, res) => {
  res.json({
    message: "Welcome to Clothify API v1",
    docs: "/api/v1/docs",
  });
});

registerPublicApiRoutes(app);
registerAdminApiRoutes(app);
registerInternalRoutes(app);

// 404 Handler
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

export default app;
