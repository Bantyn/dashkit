import { db } from "../../config/firebase.config";
import { Role } from "./role.model";
import { CacheService } from "../../infrastructure/cache/cache.service";

const COLLECTION = "roles";

const DEFAULT_ROLE_DEFINITIONS: Record<string, Omit<Role, "id">> = {
  owner: {
    name: "Shop Owner",
    permissions: ["*"],
  },
  shop_owner: {
    name: "Shop Owner",
    permissions: ["*"],
  },
  store_manager: {
    name: "Store Manager",
    permissions: [
      "admin.access",
      "sales.*",
      "inventory.*",
      "products.*",
      "customers.*",
      "purchases.*",
      "reports.view",
      "staff.view",
      "branches.view",
      "invoices.*",
      "orders.*",
    ],
  },
  manager: {
    name: "Store Manager",
    permissions: [
      "admin.access",
      "sales.*",
      "inventory.*",
      "products.*",
      "customers.*",
      "purchases.*",
      "reports.view",
      "staff.view",
      "branches.view",
      "invoices.*",
      "orders.*",
    ],
  },
  cashier: {
    name: "Cashier",
    permissions: [
      "admin.access",
      "sales.create",
      "sales.view",
      "sales.print",
      "invoices.create",
      "invoices.view",
      "invoices.print",
      "customers.view",
      "customers.create",
    ],
  },
  sales_executive: {
    name: "Sales Executive",
    permissions: [
      "admin.access",
      "sales.create",
      "sales.view",
      "products.view",
      "customers.view",
      "customers.create",
    ],
  },
  inventory_manager: {
    name: "Inventory Manager",
    permissions: [
      "admin.access",
      "inventory.*",
      "products.*",
      "categories.*",
      "brands.*",
      "variants.*",
    ],
  },
  purchase_manager: {
    name: "Purchase Manager",
    permissions: [
      "admin.access",
      "purchases.*",
      "suppliers.*",
      "inventory.view",
      "products.view",
    ],
  },
  accountant: {
    name: "Accountant",
    permissions: [
      "admin.access",
      "accounting.*",
      "reports.*",
      "invoices.view",
      "payments.*",
      "transactions.view",
    ],
  },
  crm_executive: {
    name: "CRM Executive",
    permissions: [
      "admin.access",
      "crm.*",
      "customers.*",
      "promotions.view",
    ],
  },
  marketing_executive: {
    name: "Marketing Executive",
    permissions: [
      "admin.access",
      "marketing.*",
      "promotions.*",
      "notifications.*",
    ],
  },
  website_manager: {
    name: "Website Manager",
    permissions: [
      "admin.access",
      "website.*",
      "products.view",
      "offers.*",
    ],
  },
  tailor: {
    name: "Tailor",
    permissions: [
      "admin.access",
      "tailoring.*",
      "orders.view",
    ],
  },
  delivery_staff: {
    name: "Delivery Staff",
    permissions: [
      "admin.access",
      "delivery.*",
      "orders.view",
    ],
  },
  branch_manager: {
    name: "Branch Manager",
    permissions: [
      "admin.access",
      "branches.view",
      "sales.*",
      "inventory.view",
      "staff.view",
    ],
  },
  auditor: {
    name: "Auditor",
    permissions: [
      "admin.access",
      "sales.view",
      "inventory.view",
      "products.view",
      "customers.view",
      "purchases.view",
      "accounting.view",
      "reports.view",
      "reports.export",
    ],
  },
  admin: {
    name: "Admin",
    permissions: ["*"],
  },
  staff: {
    name: "Staff",
    permissions: [
      "admin.access",
      "products.view",
      "inventory.view",
      "invoices.view",
      "customers.view",
    ],
  },
  customer: {
    name: "Customer",
    permissions: [],
  },
};

export type LegacyStaffPermissionShape = Record<string, Record<string, any> | undefined>;

export function flattenLegacyStaffPermissions(
  permissions?: LegacyStaffPermissionShape,
): string[] {
  if (!permissions) {
    return [];
  }

  const flattened = new Set<string>(["admin.access"]);

  Object.entries(permissions).forEach(([resource, actions]) => {
    Object.entries(actions || {}).forEach(([action, allowed]) => {
      if (allowed) {
        flattened.add(`${resource}.${action}`);
      }
    });
  });

  return Array.from(flattened);
}

export class RoleService {
  private readonly cache = new CacheService();
  private readonly ttlMs = 15 * 60 * 1000;
  private defaultsEnsured = false;
  private defaultsPromise: Promise<void> | null = null;

  async ensureDefaultRoles() {
    if (this.defaultsEnsured) {
      return;
    }

    if (!this.defaultsPromise) {
      this.defaultsPromise = this.ensureDefaultRolesInternal().finally(() => {
        this.defaultsPromise = null;
      });
    }

    await this.defaultsPromise;
  }

  private async ensureDefaultRolesInternal() {
    const roleIds = Object.keys(DEFAULT_ROLE_DEFINITIONS);
    const roleRefs = roleIds.map((roleId) => db.collection(COLLECTION).doc(roleId));
    const roleDocs = await db.getAll(...roleRefs);
    const batch = db.batch();
    let hasMissingRole = false;

    roleDocs.forEach((roleDoc: FirebaseFirestore.DocumentSnapshot, index: number) => {
      if (roleDoc.exists) {
        return;
      }

      const roleId = roleIds[index];
      const definition = DEFAULT_ROLE_DEFINITIONS[roleId];
      hasMissingRole = true;

      batch.set(
        roleRefs[index],
        {
          id: roleId,
          name: definition.name,
          permissions: Array.from(new Set(definition.permissions)),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );
    });

    if (hasMissingRole) {
      await batch.commit();
    }

    this.defaultsEnsured = true;
  }

  async ensureRole(
    roleId: string,
    name: string,
    permissions: string[],
  ): Promise<Role> {
    const roleRef = db.collection(COLLECTION).doc(roleId);
    const roleDoc = await roleRef.get();

    const role: Role = {
      id: roleId,
      name,
      permissions: Array.from(new Set(permissions)),
      createdAt: roleDoc.exists
        ? (roleDoc.data()?.createdAt?.toDate?.() ?? roleDoc.data()?.createdAt)
        : new Date(),
      updatedAt: new Date(),
    };

    await roleRef.set(role, { merge: true });
    this.cache.delete(`role:${roleId}`);
    return role;
  }

  async getRole(roleId: string): Promise<Role | null> {
    const cacheKey = `role:${roleId}`;
    const cached = this.cache.get<Role>(cacheKey);
    if (cached) {
      return cached;
    }

    const roleDoc = await db.collection(COLLECTION).doc(roleId).get();
    if (!roleDoc.exists) {
      const defaultDef = DEFAULT_ROLE_DEFINITIONS[roleId];
      if (defaultDef) {
        return {
          id: roleId,
          name: defaultDef.name,
          permissions: defaultDef.permissions,
        };
      }
      return null;
    }

    const role = roleDoc.data() as Role;
    this.cache.set(cacheKey, role, this.ttlMs);
    return role;
  }

  async getRolesByIds(roleIds: string[]): Promise<Role[]> {
    if (!roleIds.length) {
      return [];
    }

    const uniqueRoleIds = Array.from(new Set(roleIds));
    const roleDocs = await Promise.all(uniqueRoleIds.map((roleId) => this.getRole(roleId)));
    return roleDocs.filter(Boolean) as Role[];
  }

  async listRoles(): Promise<Role[]> {
    const snapshot = await db.collection(COLLECTION).get();
    const dbRoles = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as Role);
    const dbRoleIds = new Set(dbRoles.map((r: Role) => r.id));

    const defaultRoles: Role[] = Object.entries(DEFAULT_ROLE_DEFINITIONS)
      .filter(([id]) => !dbRoleIds.has(id))
      .map(([id, def]) => ({ id, name: def.name, permissions: def.permissions }));

    return [...dbRoles, ...defaultRoles].sort((a: Role, b: Role) => a.name.localeCompare(b.name));
  }

  async createRole(input: { id?: string; name: string; permissions: string[] }) {
    const roleId =
      input.id?.trim().toLowerCase() || input.name.trim().toLowerCase().replace(/\s+/g, "_");
    return this.ensureRole(roleId, input.name, input.permissions);
  }

  async updateRole(roleId: string, input: { name?: string; permissions?: string[] }) {
    const existing = await this.getRole(roleId);
    if (!existing) {
      return null;
    }

    return this.ensureRole(
      roleId,
      input.name || existing.name,
      input.permissions || existing.permissions || [],
    );
  }

  async deleteRole(roleId: string) {
    await db.collection(COLLECTION).doc(roleId).delete();
    this.cache.delete(`role:${roleId}`);
  }

  async ensureDefaultRoleForLegacyRole(legacyRole?: string): Promise<Role | null> {
    if (!legacyRole) {
      return null;
    }

    await this.ensureDefaultRoles();

    const normalizedRole = legacyRole === "shop_owner" ? "owner" : (legacyRole === "manager" ? "store_manager" : legacyRole);
    if (!DEFAULT_ROLE_DEFINITIONS[normalizedRole]) {
      return null;
    }

    return this.getRole(normalizedRole);
  }

  async ensureLegacyStaffRole(input: {
    staffId: string;
    shopId: string;
    displayName: string;
    permissions?: LegacyStaffPermissionShape;
  }): Promise<Role> {
    const roleId = `legacy_staff_${input.shopId}_${input.staffId}`;
    const permissions = flattenLegacyStaffPermissions(input.permissions);

    return this.ensureRole(
      roleId,
      `${input.displayName} (${input.shopId})`,
      permissions,
    );
  }
}

export const roleService = new RoleService();
