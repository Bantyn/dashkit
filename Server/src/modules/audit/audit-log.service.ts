import { Request } from "express";
import { db } from "../../config/firebase.config";
import { AuditLog, SecurityEventType } from "./audit-log.model";

const AUDIT_LOGS_COLLECTION = "audit_logs";

export class AuditLogService {
  parseClientInfo(req?: Request) {
    const userAgent = req?.headers["user-agent"] || "";
    const rawIp =
      (req?.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req?.ip ||
      req?.socket?.remoteAddress ||
      "127.0.0.1";
    const ipAddress = rawIp === "::1" || rawIp === "::ffff:127.0.0.1" ? "127.0.0.1" : rawIp;

    let browser = "Unknown Browser";
    if (userAgent.includes("Firefox/")) browser = "Firefox";
    else if (userAgent.includes("Edg/")) browser = "Edge";
    else if (userAgent.includes("Chrome/")) browser = "Chrome";
    else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) browser = "Safari";
    else if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) browser = "Internet Explorer";

    let operatingSystem = "Unknown OS";
    if (userAgent.includes("Win")) operatingSystem = "Windows";
    else if (userAgent.includes("Mac")) operatingSystem = "macOS";
    else if (userAgent.includes("Linux")) operatingSystem = "Linux";
    else if (userAgent.includes("Android")) operatingSystem = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) operatingSystem = "iOS";

    let device = "Desktop";
    if (userAgent.includes("Mobi") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
      device = "Mobile";
    } else if (userAgent.includes("iPad") || userAgent.includes("Tablet")) {
      device = "Tablet";
    }

    return { ipAddress, device, browser, operatingSystem };
  }

  async logEvent(params: {
    shopId?: string;
    email: string;
    userId?: string;
    eventType: SecurityEventType;
    failureReason?: string;
    details?: Record<string, any>;
    req?: Request;
  }): Promise<AuditLog> {
    const clientInfo = this.parseClientInfo(params.req);
    const now = new Date().toISOString();

    const logEntry: AuditLog = {
      shopId: params.shopId || "N/A",
      email: params.email.toLowerCase().trim(),
      userId: params.userId || "N/A",
      ipAddress: clientInfo.ipAddress,
      device: clientInfo.device,
      browser: clientInfo.browser,
      operatingSystem: clientInfo.operatingSystem,
      timestamp: now,
      eventType: params.eventType,
      ...(params.failureReason ? { failureReason: params.failureReason } : {}),
      ...(params.details ? { details: params.details } : {}),
    };

    const docRef = await db.collection(AUDIT_LOGS_COLLECTION).add(logEntry);
    logEntry.id = docRef.id;
    return logEntry;
  }

  async getLogsForShopOrEmail(shopId?: string, email?: string, limit: number = 50): Promise<AuditLog[]> {
    let query: FirebaseFirestore.Query = db.collection(AUDIT_LOGS_COLLECTION);

    if (shopId) {
      query = query.where("shopId", "==", shopId);
    } else if (email) {
      query = query.where("email", "==", email.toLowerCase().trim());
    }

    try {
      const snapshot = await query.orderBy("timestamp", "desc").limit(limit).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (err: any) {
      console.warn(`[AuditLogService] Fallback sorting in-memory for audit_logs query (shopId: ${shopId}, email: ${email}):`, err.message);
      try {
        const fallbackSnap = await query.limit(limit).get();
        const logs = fallbackSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AuditLog));
        return logs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      } catch (fallbackErr: any) {
        console.error("[AuditLogService] Failed to fetch audit logs:", fallbackErr.message);
        return [];
      }
    }
  }
}

export const auditLogService = new AuditLogService();
