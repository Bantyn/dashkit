import { db } from "../../config/firebase.config";
import { PlatformAdmin } from "./platform-admin.model";

const COLLECTION = "admins";

export class PlatformAdminService {
  async upsertAdmin(input: {
    uid: string;
    email: string;
    displayName: string;
    phone?: string;
    userId?: string;
    primaryRoleId?: string;
    linkedShopId?: string;
    status?: "active" | "inactive";
    metadata?: Record<string, any>;
  }): Promise<PlatformAdmin> {
    const docRef = db.collection(COLLECTION).doc(input.uid);
    const existing = await docRef.get();
    const current = existing.exists ? (existing.data() as PlatformAdmin) : null;
    const now = new Date();

    const adminProfile: PlatformAdmin = {
      id: input.uid,
      uid: input.uid,
      email: input.email.trim().toLowerCase(),
      displayName: input.displayName,
      phone: input.phone,
      userId: input.userId || input.uid,
      primaryRoleId: input.primaryRoleId || current?.primaryRoleId,
      linkedShopId: input.linkedShopId ?? current?.linkedShopId,
      status: input.status || current?.status || "active",
      createdAt: current?.createdAt || now,
      updatedAt: now,
      metadata: {
        ...(current?.metadata || {}),
        ...(input.metadata || {}),
      },
    };

    await docRef.set(adminProfile, { merge: true });
    return adminProfile;
  }
}

export const platformAdminService = new PlatformAdminService();
