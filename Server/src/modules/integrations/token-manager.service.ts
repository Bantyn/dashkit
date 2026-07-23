import * as crypto from "crypto";
import { db } from "../../infrastructure/firebase/firebase.client";

const COLLECTION = "shops";
const ALGORITHM = "aes-256-cbc";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY env variable must be set and at least 32 characters",
    );
  }
  return Buffer.from(key.slice(0, 32), "utf8");
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, cipherHex] = encryptedText.split(":");
  if (!ivHex || !cipherHex) {
    throw new Error("Invalid encrypted token format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const cipher = Buffer.from(cipherHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(cipher), decipher.final()]);
  return decrypted.toString("utf8");
}

export async function saveToken(
  shopId: string,
  token: string,
  expiry: Date,
  email: string,
): Promise<void> {
  const encryptedToken = encrypt(token);
  await db.collection(COLLECTION).doc(shopId).update({
    "shiprocket.encryptedToken": encryptedToken,
    "shiprocket.tokenExpiry": expiry,
    "shiprocket.email": email,
    "shiprocket.connected": true,
    updatedAt: new Date(),
  });
}

export async function getValidToken(shopId: string): Promise<string | null> {
  const docSnap = await db.collection(COLLECTION).doc(shopId).get();
  if (!docSnap.exists) {
    return null;
  }

  const shop = docSnap.data();
  const sr = shop?.shiprocket;

  if (!sr?.connected || !sr?.encryptedToken) {
    return null;
  }

  const expiry: Date = sr.tokenExpiry?.toDate
    ? sr.tokenExpiry.toDate()
    : new Date(sr.tokenExpiry);

  if (expiry <= new Date()) {
    await db.collection(COLLECTION).doc(shopId).update({
      "shiprocket.connected": false,
      updatedAt: new Date(),
    });
    return null;
  }

  try {
    return decrypt(sr.encryptedToken);
  } catch {
    return null;
  }
}
