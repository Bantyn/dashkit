import { db } from "../src/config/firebase.config";

async function run() {
  console.log("Updating custom plan...");
  await db.collection("plans").doc("custom").update({
    features: []
  });
  console.log("Done!");
  process.exit(0);
}

run().catch(console.error);
