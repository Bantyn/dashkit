export type CounterStatus = "active" | "disabled" | "revoked";

export interface OfflinePosCounter {
  id: string;
  shopId: string;
  branchId?: string | null;
  branchName?: string;
  name: string;
  description?: string;
  counterId: string; // e.g. CNT-001
  apiKey: string;    // e.g. apk_pos_...
  secretHash: string; // Hashed secret
  status: CounterStatus;
  location?: string;
  appVersion?: string;
  os?: string;
  desktopName?: string;
  ipAddress?: string;
  lastConnectedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfflinePosToken {
  counterId: string;
  shopId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface OfflinePosSession {
  counterId: string;
  shopId: string;
  sessionToken: string;
  lastSeenAt: Date;
  ipAddress?: string;
  status: "online" | "offline";
}

export interface OfflinePosLog {
  id: string;
  shopId: string;
  counterId: string;
  action: string;
  performedBy: string;
  details?: any;
  timestamp: Date;
}

export interface CreateCounterDTO {
  name: string;
  description?: string;
  branchId?: string;
  location?: string;
}

export interface CounterCredentialsResult {
  counter: OfflinePosCounter;
  counterId: string;
  apiKey: string;
  secretKey: string;
  connectionUrl: string;
}
