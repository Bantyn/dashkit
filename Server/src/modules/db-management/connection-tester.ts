import * as net from "net";
import axios from "axios";
import * as admin from "firebase-admin";

export class ConnectionTester {
  static async testConnection(
    provider: string,
    config: any
  ): Promise<{ success: boolean; latency: number; message: string }> {
    const startTime = Date.now();

    try {
      if (provider === "firestore") {
        return await this.testFirestore(config, startTime);
      } else if (provider === "supabase") {
        return await this.testSupabase(config, startTime);
      } else if (provider === "mongodb") {
        return await this.testMongoDB(config, startTime);
      } else if (provider === "sqlserver") {
        return await this.testSqlServer(config, startTime);
      } else {
        return {
          success: false,
          latency: 0,
          message: `Unknown database provider: ${provider}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        latency: Date.now() - startTime,
        message: err.message || "Connection failed.",
      };
    }
  }

  private static async testFirestore(
    config: any,
    startTime: number
  ): Promise<{ success: boolean; latency: number; message: string }> {
    // If testing the current running project, we can just do a read
    if (!config || Object.keys(config).length === 0 || !config.projectId) {
      const db = admin.firestore();
      await db.collection("platform_settings").limit(1).get();
      return {
        success: true,
        latency: Date.now() - startTime,
        message: "Firestore connection test successful (Default Admin Instance).",
      };
    }

    // Otherwise, initialize a temporary firebase app
    const appName = `temp-test-${Date.now()}`;
    let tempApp: admin.app.App | null = null;
    try {
      let credential: any;
      if (config.serviceAccountJson) {
        credential = admin.credential.cert(JSON.parse(config.serviceAccountJson));
      } else if (config.privateKey && config.clientEmail) {
        credential = admin.credential.cert({
          projectId: config.projectId,
          privateKey: config.privateKey.replace(/\\n/g, "\n"),
          clientEmail: config.clientEmail,
        });
      } else {
        throw new Error("Missing serviceAccountJson or privateKey/clientEmail");
      }

      tempApp = admin.initializeApp(
        {
          credential,
          databaseURL: config.databaseUrl,
          storageBucket: config.storageBucket,
        },
        appName
      );

      const db = tempApp.firestore();
      await db.collection("platform_settings").limit(1).get();

      return {
        success: true,
        latency: Date.now() - startTime,
        message: "Firestore connection test successful.",
      };
    } finally {
      if (tempApp) {
        await tempApp.delete();
      }
    }
  }

  private static async testSupabase(
    config: any,
    startTime: number
  ): Promise<{ success: boolean; latency: number; message: string }> {
    if (!config || !config.projectUrl || !config.anonKey) {
      throw new Error("Project URL and Anon Key are required");
    }

    // Ping the Supabase PostgREST health endpoint
    const baseUrl = config.projectUrl.replace(/\/$/, "");
    const url = `${baseUrl}/rest/v1/`;

    // Use serviceRoleKey if available to access the root postgrest schema
    const apiKey = config.serviceRoleKey || config.anonKey;

    try {
      const response = await axios.get(url, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 8000,
        // Don't throw on 4xx — handle them below so we can give clean messages
        validateStatus: () => true,
      });

      if (response.status === 200 || response.status === 204) {
        return {
          success: true,
          latency: Date.now() - startTime,
          message: "Supabase connection test successful.",
        };
      } else if (response.status === 401) {
        throw new Error("Invalid Anon Key or Service Role Key — authentication failed (401).");
      } else if (response.status === 404) {
        throw new Error("Project URL not found — check your Project URL (404).");
      } else {
        throw new Error(`Supabase responded with status ${response.status}. Check your credentials.`);
      }
    } catch (err: any) {
      if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
        throw new Error(`Cannot reach Supabase at ${baseUrl}. Check your Project URL.`);
      }
      if (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED") {
        throw new Error("Connection timed out. Supabase may be unreachable from this server.");
      }
      // Re-throw clean errors
      throw new Error(err.message || "Supabase connection failed.");
    }
  }

  private static async testMongoDB(
    config: any,
    startTime: number
  ): Promise<{ success: boolean; latency: number; message: string }> {
    if (!config || !config.connectionString) {
      throw new Error("MongoDB Connection String is required");
    }

    // Parse host and port from connection string
    // e.g. mongodb+srv://username:password@cluster0.abcde.mongodb.net/dbname
    // or mongodb://127.0.0.1:27017/dbname
    let host = "localhost";
    let port = 27017;

    const connStr = config.connectionString;
    const match = connStr.match(/@([^/:?]+)(?::(\d+))?/);
    if (match) {
      host = match[1];
      if (match[2]) {
        port = parseInt(match[2], 10);
      } else if (connStr.startsWith("mongodb+srv")) {
        port = 443; // Atlas uses TLS / SRV
      }
    } else {
      // Local host parsing
      const localMatch = connStr.match(/\/\/([^/:?]+)(?::(\d+))?/);
      if (localMatch) {
        host = localMatch[1];
        if (localMatch[2]) {
          port = parseInt(localMatch[2], 10);
        }
      }
    }

    const reachable = await this.pingPort(host, port, 5000);
    if (reachable) {
      return {
        success: true,
        latency: Date.now() - startTime,
        message: `MongoDB connection successful (Network ping to ${host}:${port} succeeded).`,
      };
    } else {
      throw new Error(`Could not connect to MongoDB server at ${host}:${port}`);
    }
  }

  private static async testSqlServer(
    config: any,
    startTime: number
  ): Promise<{ success: boolean; latency: number; message: string }> {
    if (!config || !config.host) {
      throw new Error("SQL Server Host is required");
    }

    const host = config.host;
    const port = config.port ? parseInt(config.port, 10) : 1433;

    const reachable = await this.pingPort(host, port, 5000);
    if (reachable) {
      return {
        success: true,
        latency: Date.now() - startTime,
        message: `SQL Server connection successful (Network ping to ${host}:${port} succeeded).`,
      };
    } else {
      throw new Error(`Could not connect to SQL Server at ${host}:${port}`);
    }
  }

  private static pingPort(host: string, port: number, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isResolved = false;

      const finish = (result: boolean) => {
        if (!isResolved) {
          isResolved = true;
          socket.destroy();
          resolve(result);
        }
      };

      socket.setTimeout(timeoutMs);
      socket.connect(port, host, () => {
        finish(true);
      });

      socket.on("error", () => {
        finish(false);
      });

      socket.on("timeout", () => {
        finish(false);
      });
    });
  }
}
