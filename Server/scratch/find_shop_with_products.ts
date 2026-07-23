import * as dotenv from 'dotenv';
dotenv.config();

import { db } from "../src/config/firebase.config";

async function run() {
  const snapshot = await db.collection("products").limit(5).get();
  if (snapshot.empty) {
    console.log("No products found in the entire database!");
    return;
  }
  
  console.log("Found products:");
  snapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    console.log(`Product ID: ${doc.id}, Shop ID: ${data.shopId}, Name: ${data.name}`);
    if (data.variants && data.variants.length > 0) {
      console.log(`  Variants: ${JSON.stringify(data.variants.map((v: any) => v.sku))}`);
    }
  });
}

run().then(() => process.exit(0)).catch(console.error);
