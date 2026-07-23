import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

import { initFirestoreTracker, wrapFirestore } from "./firestore-tracker";

dotenv.config({ quiet: true } as any);

try {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

  // 1. Decode Base64 if passed as base64
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----") && privateKey.length > 100) {
    try {
      const decoded = Buffer.from(privateKey, "base64").toString("utf-8");
      if (decoded.includes("-----BEGIN PRIVATE KEY-----")) {
        privateKey = decoded;
      }
    } catch (_) {}
  }

  // 2. Remove surrounding quotes
  privateKey = privateKey.replace(/^["']|["']$/g, "").trim();

  // 3. Unescape literal \n strings to real newlines
  privateKey = privateKey.replace(/\\n/g, "\n");

  // 4. Ensure correct PEM line formatting if newlines got stripped
  if (!privateKey.includes("\n") && privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    privateKey = privateKey
      .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
      .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

const rawFirestore = admin.firestore();
rawFirestore.settings({ ignoreUndefinedProperties: true });

initFirestoreTracker(rawFirestore);

export const rawDb = rawFirestore;
export const db = wrapFirestore(rawFirestore);
export const storage = admin.storage();
export const auth = admin.auth();

export { admin };
