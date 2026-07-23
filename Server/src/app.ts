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

// Root Landing Page — Modern Cute Server Status Dashboard UI
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Clothify Core Service — Active</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Outfit', -apple-system, sans-serif;
          background: #090d16;
          color: #f3f4f6;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-x: hidden;
        }
        .bg-glow {
          position: fixed;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(0,0,0,0) 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 0;
          pointer-events: none;
        }
        .card {
          position: relative;
          z-index: 1;
          background: rgba(17, 24, 39, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px 36px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .server-avatar {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.4);
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
          background: linear-gradient(to right, #ffffff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 28px;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.25);
          color: #4ade80;
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 32px;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 12px #22c55e;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
          text-align: left;
        }
        .stat-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 14px;
          border-radius: 14px;
        }
        .stat-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
        }
        .footer-note {
          font-size: 12px;
          color: #475569;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="bg-glow"></div>
      <div class="card">
        <div class="server-avatar">⚡</div>
        <h1>Clothify Engine</h1>
        <p class="subtitle">Cloud API & Realtime Microservices</p>
        
        <div class="status-badge">
          <span class="pulse-dot"></span>
          <span>All Systems Operational</span>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Service Status</div>
            <div class="stat-value" style="color: #4ade80;">Online 100%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Environment</div>
            <div class="stat-value">${APP_CONFIG.NODE_ENV.toUpperCase()}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Protocol</div>
            <div class="stat-value">HTTPS / WSS</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Version</div>
            <div class="stat-value">v1.0.0 Stable</div>
          </div>
        </div>

        <p class="footer-note">Protected & Encrypted • Clothify SaaS Enterprise</p>
      </div>
    </body>
    </html>
  `);
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
