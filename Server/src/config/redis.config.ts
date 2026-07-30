import dotenv from "dotenv";
dotenv.config();

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  url?: string;
  tls?: boolean;
  maxRetriesPerRequest: number | null;
  enableOfflineQueue: boolean;
}

export const REDIS_CONFIG: RedisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  url: process.env.REDIS_URL || undefined,
  tls: process.env.REDIS_TLS === "true" ? true : undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableOfflineQueue: false
};

export function getRedisConnectionOptions() {
  if (REDIS_CONFIG.url) {
    return {
      url: REDIS_CONFIG.url,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false
    };
  }

  return {
    host: REDIS_CONFIG.host,
    port: REDIS_CONFIG.port,
    password: REDIS_CONFIG.password,
    tls: REDIS_CONFIG.tls ? {} : undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 5000
  };
}
