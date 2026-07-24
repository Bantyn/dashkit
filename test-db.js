const admin = require('./Server/node_modules/firebase-admin');
const fs = require('fs');
let privateKey = '';
const envFile = fs.readFileSync('./Server/.env', 'utf8');
envFile.split('\n').forEach(line => {
  if (line.startsWith('FIREBASE_PRIVATE_KEY=')) privateKey = line.split('=')[1].replace(/"/g, '').replace(/\\n/g, '\n');
  if (line.startsWith('FIREBASE_PROJECT_ID=')) process.env.FIREBASE_PROJECT_ID = line.split('=')[1].trim();
  if (line.startsWith('FIREBASE_CLIENT_EMAIL=')) process.env.FIREBASE_CLIENT_EMAIL = line.split('=')[1].trim();
});

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: privateKey.trim(),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  })
});

const db = admin.firestore();
async function run() {
  try {
    const shopRef = db.collection('shops').doc('shop_GdnyhMciuRPcqVUxvkdSy1ERRWP2');
    const doc = await shopRef.get();
    console.log('Shop Data:', JSON.stringify(doc.data(), null, 2));

    const plansRef = await db.collection('subscription_plans').get();
    plansRef.docs.forEach(p => {
      console.log('Plan:', p.id, 'Features:', p.data().features);
    });
  } catch(e) { console.error(e); }
  process.exit();
}
run();
