import { db } from "../src/config/firebase.config";
import { DEFAULT_PLANS, DEFAULT_FEATURES } from "../src/modules/subscription/subscription.constants";

async function run() {
  console.log("Forcing update of plans and features in Firestore...");
  
  // Update features
  for (const feature of DEFAULT_FEATURES) {
    await db.collection("features").doc(feature.key).set(feature, { merge: true });
    console.log(`Updated feature: ${feature.key}`);
  }

  // Update plans (except custom, keep its features as empty array/custom config, wait, custom plan is also updated in constants as features: [])
  for (const plan of DEFAULT_PLANS) {
    if (plan.id === "custom") {
      // Do not overwrite features for custom plan as they are managed via customFeatures. But we can update description/limits.
      await db.collection("plans").doc(plan.id).set({
        ...plan,
        features: [] // Always 0 default features for custom
      }, { merge: true });
    } else {
      await db.collection("plans").doc(plan.id).set(plan, { merge: true });
    }
    console.log(`Updated plan: ${plan.id}`);
  }

  console.log("Firestore update complete!");
  process.exit(0);
}

run().catch(console.error);
