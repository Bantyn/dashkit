export const APP_CONFIG = {
  PORT: process.env.PORT || 3003,
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:4200",
  ADMIN_FRONTEND_URL:
    process.env.ADMIN_FRONTEND_URL || "http://localhost:4201",
  STOREFRONT_BASE_URL:
    process.env.STOREFRONT_BASE_URL || "http://localhost:4200",

  // CORS Configuration
  CORS_ORIGINS: (
    [
      "http://localhost:4200",
      "http://localhost:4201",
      "http://localhost:4202",
      "http://localhost:3003",
      process.env.FRONTEND_URL,
      process.env.ADMIN_FRONTEND_URL,
      process.env.STOREFRONT_BASE_URL,
    ].filter(
      (origin): origin is string =>
        typeof origin === "string" && origin.length > 0,
    ) as (string | RegExp)[]
  ).concat([
    // localhost any port
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^http:\/\/[a-z0-9-]+\.localhost:\d+$/,
    // LAN / Private Network ranges - all standard RFC-1918 ranges
    /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
    /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
    /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/,
    // Tunnel services for remote testing
    /^https:\/\/.*\.trycloudflare\.com$/,
    /^https:\/\/.*\.loca\.lt$/,
    /^http:\/\/.*\.nip\.io(:\d+)?$/,
    // Vercel & Cloud Hosting domains
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.onrender\.com$/,
  ]),

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
};

export const CONSTANTS = {
  PLANS: {
    FREE: {
      name: "Free Plan",
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: "INR",
      features: [],
      limits: { staff_count: 2, branch_count: 1, invoices_per_month: 50, products_count: 50 }
    },
    BASIC: {
      name: "Basic Plan",
      monthlyPrice: 499,
      yearlyPrice: 4990,
      currency: "INR",
      features: [],
      limits: { staff_count: 5, branch_count: 1, invoices_per_month: -1, products_count: 500 }
    },
    PRO: {
      name: "Pro Plan",
      monthlyPrice: 1499,
      yearlyPrice: 14990,
      currency: "INR",
      features: [],
      limits: { staff_count: 20, branch_count: 2, invoices_per_month: -1, products_count: -1 }
    }
  }
};


