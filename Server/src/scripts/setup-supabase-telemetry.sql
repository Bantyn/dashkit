-- Supabase Schema for Telemetry and Usage Tracking

-- 1. Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
    id TEXT PRIMARY KEY,
    "shopId" TEXT,
    "userId" TEXT,
    "planId" TEXT NOT NULL,
    "limitKey" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    data JSONB NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for O(1) lookups during request limit checks
CREATE INDEX IF NOT EXISTS idx_usage_tracking_lookup 
ON usage_tracking("shopId", "limitKey", "periodKey");

-- 2. Create shop_counters table for PG-native triggers (Optional but recommended)
CREATE TABLE IF NOT EXISTS shop_counters (
    "shopId" TEXT PRIMARY KEY,
    products INTEGER DEFAULT 0,
    invoices INTEGER DEFAULT 0,
    orders INTEGER DEFAULT 0,
    customers INTEGER DEFAULT 0,
    staff INTEGER DEFAULT 0,
    branches INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Copy the contents of this file and run it inside your Supabase project's SQL Editor to fully complete Phase 3 of the database migration!
