import { db } from "../../config/firebase.config";
import { UserRole } from "./user-role.model";
import { CacheService } from "../../infrastructure/cache/cache.service";

const COLLECTION = "user_roles";

export class UserRoleService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 15 * 60 * 1000; // 15 minutes

  private getCacheKey(userId: string, shopId: string) {
    return `user-roles:${userId}:${shopId}`;
  }

  private buildId(userId: string, roleId: string, shopId: string) {
    return `${userId}_${shopId}_${roleId}`;
  }

  async assignRole(input: {
    userId: string;
    roleId: string;
    shopId: string;
  }): Promise<UserRole> {
    const userRole: UserRole = {
      id: this.buildId(input.userId, input.roleId, input.shopId),
      userId: input.userId,
      roleId: input.roleId,
      shopId: input.shopId,
      updatedAt: new Date(),
    };

    const docRef = db.collection(COLLECTION).doc(userRole.id);
    const existingDoc = await docRef.get();
    userRole.createdAt = existingDoc.exists
      ? (existingDoc.data()?.createdAt?.toDate?.() ?? existingDoc.data()?.createdAt)
      : new Date();

    await docRef.set(userRole, { merge: true });
    
    this.cache.delete(this.getCacheKey(input.userId, input.shopId));

    try {
      const { authService } = require("../auth/auth.service");
      authService.invalidateAccessContext(input.userId, input.shopId);
    } catch (err) {
      console.error("Failed to invalidate access context:", err);
    }

    return userRole;
  }

  async getUserRoles(userId: string, shopId: string): Promise<UserRole[]> {
    const cacheKey = this.getCacheKey(userId, shopId);
    const cached = this.cache.get<UserRole[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const snapshot = await db
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .where("shopId", "==", shopId)
      .get();

    const roles = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as UserRole);
    this.cache.set(cacheKey, roles, this.ttlMs);
    return roles;
  }
}

export const userRoleService = new UserRoleService();

