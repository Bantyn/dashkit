import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

import { initFirestoreTracker, wrapFirestore } from "./firestore-tracker";

dotenv.config({ quiet: true } as any);

try {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

  // 1. If base64 encoded, decode it
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----") && privateKey.length > 100) {
    try {
      const decoded = Buffer.from(privateKey, "base64").toString("utf-8");
      if (decoded.includes("-----BEGIN PRIVATE KEY-----")) {
        privateKey = decoded;
      }
    } catch (_) {}
  }

  // 2. Clean outer quotes if any
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  // 3. Convert escaped newlines \n to actual newlines
  privateKey = privateKey.replace(/\\n/g, "\n");

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
