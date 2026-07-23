import * as dotenv from "dotenv";
dotenv.config({ quiet: true } as any);

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import "./config/firebase.config"; // Auto-initializes Firebase
import { DB_CONFIG } from "./application/repositories/providers/db-provider.config";
import { DatabaseConfigService } from "./modules/db-management/db-config.service";

// Load active DB provider config on startup asynchronously
DatabaseConfigService.getActiveProvider()
  .then((provider) => {
    DB_CONFIG.PROVIDER = provider as any;
    // console.log(`[Database] Dynamic DB provider loaded: ${provider}`);
  })
  .catch((err) => {
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health Check — enhanced for LAN/network diagnostics
app.get("/health", (req, res) => {
  const os = require("os");
  const interfaces = os.networkInterfaces();
  const lanIps: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
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
      lan: lanIps.map((ip) => `http://${ip}:${port}`),
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
    },
  });
});

// Root Landing Page — Modern Cute Server Status Dashboard// Root Landing Page — Cosmic Parallax with Non-sensitive Server Status Overlay UI
app.get("/", (req, res) => {
  const env = APP_CONFIG.NODE_ENV.toUpperCase();
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DashKit Cloud Engine — Active</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --animation-iteration: infinite;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body, html {
      width: 100%;
      height: 100%;
      font-family: 'Outfit', sans-serif;
      background: #02040a;
      overflow: hidden;
      color: #ffffff;
    }

    .cosmic-parallax-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
      overflow: hidden;
    }

    /* Star Layers */
    .cosmic-stars, .cosmic-stars-medium, .cosmic-stars-large {
      position: absolute;
      top: 0;
      left: 0;
      border-radius: 50%;
      background: transparent;
    }

    .cosmic-stars {
      width: 1px;
      height: 1px;
      animation: animStar 50s linear var(--animation-iteration);
    }

    .cosmic-stars-medium {
      width: 2px;
      height: 2px;
      animation: animStar 100s linear var(--animation-iteration);
    }

    .cosmic-stars-large {
      width: 3px;
      height: 3px;
      animation: animStar 150s linear var(--animation-iteration);
    }

    /* Horizon and Earth Glow Effects */
    #horizon {
      position: absolute;
      bottom: 0;
      width: 100%;
      height: 300px;
      background: radial-gradient(ellipse at bottom, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0) 70%);
      pointer-events: none;
      z-index: 1;
    }

    #horizon .glow {
      position: absolute;
      bottom: -150px;
      left: 50%;
      transform: translateX(-50%);
      width: 120vw;
      height: 300px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(168, 85, 247, 0.15) 40%, rgba(0,0,0,0) 70%);
      border-radius: 50%;
      filter: blur(40px);
    }

    #earth {
      position: absolute;
      bottom: -400px;
      left: 50%;
      transform: translateX(-50%);
      width: 140vw;
      height: 600px;
      background: radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 80%);
      border-radius: 50%;
      box-shadow: 0 -20px 50px rgba(56, 189, 248, 0.3), inset 0 10px 30px rgba(168, 85, 247, 0.2);
      z-index: 2;
      border-top: 1px solid rgba(148, 163, 184, 0.2);
    }

    /* Titles and Subtitles */
    #title {
      position: relative;
      z-index: 10;
      font-size: 4.5rem;
      font-weight: 900;
      letter-spacing: 20px;
      padding-left: 20px;
      text-transform: uppercase;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #864fe0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
      text-align: center;
      animation: animGravity 8s cubic-bezier(0.25, 1, 0.5, 1) var(--animation-iteration);
    }

    #subtitle {
      position: relative;
      z-index: 10;
      display: flex;
      gap: 16px;
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 28px;
    }

    .subtitle-part-1 {
      color: #38bdf8;
      animation: animDont 8s cubic-bezier(0.25, 1, 0.5, 1) var(--animation-iteration);
    }

    .subtitle-part-2 {
      color: #c084fc;
      animation: animLet 8s cubic-bezier(0.25, 1, 0.5, 1) var(--animation-iteration);
    }

    .subtitle-part-3 {
      color: #f472b6;
      animation: animGo 8s cubic-bezier(0.25, 1, 0.5, 1) var(--animation-iteration);
    }

    /* Server Info Card Overlay */
    .server-card {
      position: relative;
      z-index: 20;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 24px 32px;
      width: 90%;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ade80;
      padding: 5px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      background-color: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 10px #22c55e;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      text-align: left;
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 10px 14px;
      border-radius: 12px;
    }

    .stat-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .stat-value {
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
    }

    .footer-note {
      font-size: 11px;
      color: #475569;
      margin-top: 14px;
    }

    /* Keyframe Animations */
    @keyframes animStar {
      from { transform: translateY(0px); }
      to { transform: translateY(-2000px); }
    }

    @keyframes animGravity {
      0% { transform: translateY(-26px); opacity: 0; }
      30%, 80% { letter-spacing: 20px; padding-left: 20px; transform: translateY(0px); opacity: 1; }
      92%, 100% { letter-spacing: 16px; padding-left: 16px; transform: translateY(-4px); opacity: 0; }
    }

    @keyframes animDont {
      0%, 15% { transform: translateY(-26px); opacity: 0; }
      35%, 80% { transform: translateY(0px); opacity: 1; }
      92%, 100% { transform: translateY(-4px); opacity: 0; }
    }

    @keyframes animLet {
      0%, 25% { transform: translateY(-26px); opacity: 0; }
      45%, 80% { transform: translateY(0px); opacity: 1; }
      92%, 100% { transform: translateY(-4px); opacity: 0; }
    }

    @keyframes animGo {
      0%, 35% { transform: translateY(-26px); opacity: 0; }
      55%, 80% { transform: translateY(0px); opacity: 1; }
      92%, 100% { transform: translateY(-4px); opacity: 0; }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    @media (max-width: 768px) {
      #title { font-size: 2.5rem; letter-spacing: 10px; padding-left: 10px; }
      #subtitle { font-size: 0.85rem; letter-spacing: 2px; flex-direction: column; align-items: center; gap: 6px; }
    }
  </style>
</head>
<body>

  <div class="cosmic-parallax-container">
    <!-- Star Field Layers -->
    <div id="stars" class="cosmic-stars"></div>
    <div id="stars2" class="cosmic-stars-medium"></div>
    <div id="stars3" class="cosmic-stars-large"></div>
    
    <!-- Horizon and Earth Arc -->
    <div id="horizon"><div class="glow"></div></div>
    <div id="earth"></div>
    
    <!-- Animated Titles -->
    <div id="title">DashKit</div>
    <div id="subtitle">
      <span class="subtitle-part-1">FAST</span>
      <span class="subtitle-part-2">POWERFUL</span>
      <span class="subtitle-part-3">SCALABLE</span>
    </div>

    <!-- Non-Sensitive Server Status Overlay -->
    <div class="server-card">
      <div class="status-badge">
        <span class="pulse-dot"></span>
        <span>Systems Operational</span>
      </div>

      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Server Status</div>
          <div class="stat-value" style="color: #4ade80;">Active (100%)</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Environment</div>
          <div class="stat-value">${env}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Protocols</div>
          <div class="stat-value">HTTPS / WSS</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Engine Version</div>
          <div class="stat-value">v1.0.0 Stable</div>
        </div>
      </div>

      <p class="footer-note">Encrypted & Protected • DashKit Enterprise Cloud</p>
    </div>
  </div>

  <script>
    (function initCosmicParallax() {
      function generateStarBoxShadow(count) {
        const shadows = [];
        for (let i = 0; i < count; i++) {
          const x = Math.floor(Math.random() * 2000);
          const y = Math.floor(Math.random() * 2000);
          shadows.push(\`\${x}px \${y}px #FFF\`);
        }
        return shadows.join(', ');
      }

      const starsSmall = document.getElementById('stars');
      const starsMedium = document.getElementById('stars2');
      const starsLarge = document.getElementById('stars3');

      if (starsSmall) starsSmall.style.boxShadow = generateStarBoxShadow(700);
      if (starsMedium) starsMedium.style.boxShadow = generateStarBoxShadow(200);
      if (starsLarge) starsLarge.style.boxShadow = generateStarBoxShadow(100);
    })();
  </script>
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
