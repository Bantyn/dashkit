import * as dotenv from 'dotenv';
dotenv.config();

import { db } from "../src/config/firebase.config";
import { globalFirestoreStats } from "../src/infrastructure/firebase/firestore-tracker";
import { authService } from "../src/modules/auth/auth.service";
import { userService } from "../src/modules/user/user.service";
import { userRoleService } from "../src/modules/user-role/user-role.service";
import { subscriptionService } from "../src/modules/subscription/subscription.service";
import { productService } from "../src/modules/product/product.service";

async function runVerification() {
  console.log("=== Clothify Optimization Verification Script ===");

  // Find a product first to get a shop with inventory/products
  const prodSnapshot = await db.collection("products").limit(1).get();
  if (prodSnapshot.empty) {
    console.log("❌ No products found in database!");
    return;
  }
  const prodData = prodSnapshot.docs[0].data();
  const shopId = prodData.shopId;
  const testBarcode = prodData.variants && prodData.variants.length > 0 ? prodData.variants[0].sku : "";

  // Now find a user belonging to this shop
  const userSnapshot = await db.collection("users").where("shopId", "==", shopId).limit(1).get();
  if (userSnapshot.empty) {
    console.log(`❌ No users found for shop ${shopId}!`);
    return;
  }
  const uid = userSnapshot.docs[0].id;

  console.log(`Using Test User: ${uid}`);
  console.log(`Using Test Shop: ${shopId}`);
  console.log(`Using Test Barcode/SKU: ${testBarcode}`);

  // --- ROUND 1 (COLD) ---
  console.log("\n--- Round 1: Cold Run (Cache is empty) ---");
  const readsStartCold = globalFirestoreStats.readsToday;
  const startCold = Date.now();

  console.log("Loading User Profile...");
  const profileCold = await userService.getByUid(uid);

  console.log("Resolving Access Context...");
  const accessCold = await authService.resolveAccessContext(uid, shopId);

  console.log("Resolving Subscription Access Context...");
  const subCold = await subscriptionService.resolveAccessContext({ userId: uid, shopId });

  let barcodeProductCold = null;
  if (testBarcode) {
    console.log("Searching Product by Barcode...");
    barcodeProductCold = await productService.getProductByBarcode(shopId, testBarcode);
  }

  const durationCold = Date.now() - startCold;
  const readsEndCold = globalFirestoreStats.readsToday;
  const readsCold = readsEndCold - readsStartCold;

  console.log(`Cold Run Finished: Time = ${durationCold}ms, Firestore Reads = ${readsCold}`);

  // --- ROUND 2 (HOT) ---
  console.log("\n--- Round 2: Hot Run (Cache populated) ---");
  const readsStartHot = globalFirestoreStats.readsToday;
  const startHot = Date.now();

  console.log("Loading User Profile (Hot)...");
  const profileHot = await userService.getByUid(uid);

  console.log("Resolving Access Context (Hot)...");
  const accessHot = await authService.resolveAccessContext(uid, shopId);

  console.log("Resolving Subscription Access Context (Hot)...");
  const subHot = await subscriptionService.resolveAccessContext({ userId: uid, shopId });

  let barcodeProductHot = null;
  if (testBarcode) {
    console.log("Searching Product by Barcode (Hot)...");
    barcodeProductHot = await productService.getProductByBarcode(shopId, testBarcode);
  }

  const durationHot = Date.now() - startHot;
  const readsEndHot = globalFirestoreStats.readsToday;
  const readsHot = readsEndHot - readsStartHot;

  console.log(`Hot Run Finished: Time = ${durationHot}ms, Firestore Reads = ${readsHot}`);

  // --- VERIFICATION RESULTS ---
  console.log("\n=== Optimization Verification Summary ===");
  console.log(`Cold Run Reads: ${readsCold}`);
  console.log(`Hot Run Reads: ${readsHot}`);
  console.log(`Read Reduction: ${((1 - (readsHot / (readsCold || 1))) * 100).toFixed(1)}%`);
  console.log(`Cold Run Latency: ${durationCold}ms`);
  console.log(`Hot Run Latency: ${durationHot}ms`);
  console.log(`Latency Reduction: ${((1 - (durationHot / (durationCold || 1))) * 100).toFixed(1)}%`);

  if (readsHot === 0) {
    console.log("✅ SUCCESS: Zero Firestore reads performed on Hot Cache!");
  } else {
    console.log(`⚠️ WARNING: Hot Run performed ${readsHot} reads. Check caching logic.`);
  }

  if (testBarcode) {
    if (barcodeProductCold && barcodeProductHot && barcodeProductCold.id === barcodeProductHot.id) {
      console.log("✅ SUCCESS: Barcode search returned correct product and is identical across runs.");
    } else {
      console.log("❌ FAILURE: Barcode search returned mismatched or null products.");
    }
  }
}

runVerification().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
