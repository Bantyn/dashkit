import { auth, db } from "../config/firebase.config";
import { CONSTANTS } from "../config/app.config";
import { roleService } from "../modules/role/role.service";
import { userService } from "../modules/user/user.service";
import { platformAdminService } from "../modules/platform-admin/platform-admin.service";
import { SupabaseManager } from "../infrastructure/supabase/supabase.client";

const COLLECTIONS = {
  packages: "packages",
  shops: "shops",
  users: "users",
};

function getEnv(name: string, fallback?: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

async function ensurePackages() {
  const packageEntries = [
    { id: "free", code: "FREE", ...CONSTANTS.PLANS.FREE },
    { id: "basic", code: "BASIC", ...CONSTANTS.PLANS.BASIC },
    { id: "pro", code: "PRO", ...CONSTANTS.PLANS.PRO },
  ];

  const batch = db.batch();
  packageEntries.forEach((pkg) => {
    batch.set(
      db.collection(COLLECTIONS.packages).doc(pkg.id),
      {
        ...pkg,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true },
    );
  });
  await batch.commit();
}

async function getOrCreateFirebaseAdmin(input: {
  email: string;
  password: string;
  displayName: string;
  phone: string;
}) {
  try {
    const existing = await auth.getUserByEmail(input.email);

    await auth.updateUser(existing.uid, {
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      phoneNumber: input.phone,
      disabled: false,
    });

    return auth.getUser(existing.uid);
  } catch (error: any) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }

  return auth.createUser({
    email: input.email,
    password: input.password,
    displayName: input.displayName,
    phoneNumber: input.phone,
    disabled: false,
  });
}

async function removeDummyShopAndCleanUser(adminUid: string) {
  // Delete shop_demo from Firestore
  try {
    await db.collection("shops").doc("shop_demo").delete();
  } catch (e) {}

  // Delete shop_demo from Supabase
  try {
    const supabase = await SupabaseManager.getClient();
    await supabase.from("shops").delete().eq("id", "shop_demo");
  } catch (e) {}

  // Remove shopId from Firestore users doc for adminUid
  try {
    await db.collection("users").doc(adminUid).update({
      shopId: db.FieldValue.delete() as any,
    });
  } catch (e) {}

  // Remove shopId from Supabase users row for adminUid
  try {
    const supabase = await SupabaseManager.getClient();
    const { data: userRow } = await supabase.from("users").select("*").eq("id", adminUid).single();
    if (userRow && userRow.data) {
      delete userRow.data.shopId;
      await supabase.from("users").update({ shopId: null, data: userRow.data }).eq("id", adminUid);
    }
  } catch (e) {}
}

async function main() {
  const adminEmail = getEnv("SEED_ADMIN_EMAIL", "admin@gmail.com") as string;
  const adminPassword = getEnv("SEED_ADMIN_PASSWORD", "admin@123") as string;
  const adminName = getEnv("SEED_ADMIN_NAME", "Clothify Super Admin") as string;
  const adminPhone = getEnv("SEED_ADMIN_PHONE", "+919999999999") as string;

  await ensurePackages();
  await roleService.ensureDefaultRoles();

  const firebaseUser = await getOrCreateFirebaseAdmin({
    email: adminEmail,
    password: adminPassword,
    displayName: adminName,
    phone: adminPhone,
  });

  await userService.upsertUser({
    uid: firebaseUser.uid,
    email: adminEmail,
    phone: adminPhone,
    mobile: adminPhone,
    name: adminName,
    displayName: adminName,
    roleId: "admin",
    planId: "pro",
    isActive: true,
    emailVerified: true,
    mobileVerified: true,
    isBlocked: false,
    metadata: {
      userType: "platform_admin",
      adminScope: "platform",
    },
  });

  await platformAdminService.upsertAdmin({
    uid: firebaseUser.uid,
    userId: firebaseUser.uid,
    email: adminEmail,
    displayName: adminName,
    phone: adminPhone,
    primaryRoleId: "admin",
    metadata: {
      seededBy: "seed_admin",
    },
  });

  await removeDummyShopAndCleanUser(firebaseUser.uid);

  console.log("[seed:admin] Platform Super Admin is ready (pure admin, no dummy shop)");
  console.log(
    JSON.stringify(
      {
        adminEmail,
        adminPassword,
        adminUid: firebaseUser.uid,
        role: "platform_admin",
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed:admin] Failed:", error);
    process.exit(1);
  });
