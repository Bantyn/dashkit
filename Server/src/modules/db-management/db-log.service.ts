import { db } from "../../config/firebase.config";

const LOGS_COLLECTION = "database_logs";

export interface DatabaseLog {
  id?: string;
  timestamp: Date;
  type: "connection" | "switch" | "error" | "validation" | "failed_login" | "exception" | "seeding";
  provider: string;
  status: "success" | "failed" | "info";
  message: string;
  details?: any;
}

export class DatabaseLogService {
  static async logEvent(
    type: DatabaseLog["type"],
    provider: string,
    status: DatabaseLog["status"],
    message: string,
    details?: any
  ): Promise<void> {
    try {
      const log: DatabaseLog = {
        timestamp: new Date(),
        type,
        provider,
        status,
        message,
        details: details ? JSON.stringify(details) : null,
      };

      const ref = db.collection(LOGS_COLLECTION).doc();
      log.id = ref.id;
      await ref.set(log);
    } catch (err) {
      console.error("Failed to write to database logs collection:", err);
    }
  }

  static async getLogs(limit = 50): Promise<any[]> {
    try {
      const snapshot = await db
        .collection(LOGS_COLLECTION)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp) : new Date(),
        };
      });
    } catch (err) {
      console.error("Failed to fetch database logs:", err);
      return [];
    }
  }
}
