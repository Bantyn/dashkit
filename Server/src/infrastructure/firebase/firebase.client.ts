import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

import { initFirestoreTracker, wrapFirestore } from "./firestore-tracker";

dotenv.config({ quiet: true } as any);

try {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
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
