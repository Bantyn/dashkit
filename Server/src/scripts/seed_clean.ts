import { auth, db } from "../config/firebase.config";
import { CONSTANTS } from "../config/app.config";
import { roleService } from "../modules/role/role.service";
import { userService } from "../modules/user/user.service";
import { platformAdminService } from "../modules/platform-admin/platform-admin.service";

const COLLECTIONS = {
  packages: "packages",
  shops: "shops",
};

const CONFIRM_VALUE = "CLEAN_ALL_DATA";

function getEnv(name: string, fallback?: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

async function clearFirestore() {
  const collections = await db.listCollections();

  for (const collection of collections) {
    console.log(`[seed:clean] Deleting collection: ${collection.id}`);
    await db.recursiveDelete(collection);
  }
}

async function clearAuthUsers() {
  let nextPageToken: string | undefined;

  do {
    const page = await auth.listUsers(1000, nextPageToken);

    if (page.users.length) {
      await auth.deleteUsers(page.users.map((user) => user.uid));
      console.log(
        `[seed:clean] Deleted ${page.users.length} Firebase auth user(s)`,
      );
    }

    nextPageToken = page.pageToken;
  } while (nextPageToken);
}

async function seedPackages() {
  const packageEntries = [
    { id: "free", code: "FREE", ...CONSTANTS.PLANS.FREE },
    { id: "basic", code: "BASIC", ...CONSTANTS.PLANS.BASIC },
    { id: "pro", code: "PRO", ...CONSTANTS.PLANS.PRO },
  ];

  const batch = db.batch();
  packageEntries.forEach((pkg) => {
    batch.set(db.collection(COLLECTIONS.packages).doc(pkg.id), {
      ...pkg,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  await batch.commit();

  console.log("[seed:clean] Seeded packages collection");
}

async function seedAdmin() {
  const adminEmail = getEnv("SEED_ADMIN_EMAIL", "admin@gmail.com") as string;
  const adminPassword = getEnv("SEED_ADMIN_PASSWORD", "admin@123") as string;
  const adminName = getEnv("SEED_ADMIN_NAME", "Clothify Super Admin") as string;
  const adminPhone = getEnv("SEED_ADMIN_PHONE", "+919999999999") as string;

  const firebaseUser = await auth.createUser({
    email: adminEmail,
    password: adminPassword,
    displayName: adminName,
    phoneNumber: adminPhone,
    disabled: false,
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

  await roleService.ensureDefaultRoles();

  await platformAdminService.upsertAdmin({
    uid: firebaseUser.uid,
    userId: firebaseUser.uid,
    email: adminEmail,
    displayName: adminName,
    phone: adminPhone,
    primaryRoleId: "admin",
    metadata: {
      seededBy: "seed_clean",
    },
  });

  console.log("[seed:clean] Seeded pure platform admin user and roles");
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

async function main() {
  const confirmArg = process.argv.find((arg) =>
    arg.startsWith("--confirm="),
  );
  const confirmValue = confirmArg ? confirmArg.split("=")[1] : undefined;

  if (confirmValue !== CONFIRM_VALUE) {
    console.error(
      `[seed:clean] Refusing to run without explicit confirmation. Pass --confirm=${CONFIRM_VALUE}`,
    );
    process.exit(1);
  }

  console.log("[seed:clean] Starting full clean + seed process...");
  await clearFirestore();
  await clearAuthUsers();
  await seedPackages();
  await seedAdmin();
  console.log("[seed:clean] Process completed successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed:clean] Failed:", error);
    process.exit(1);
  });
