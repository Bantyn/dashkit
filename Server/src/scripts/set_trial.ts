import { db } from '../infrastructure/firebase/firebase.client';

async function setTrial() {
  const shopId = 'shop_0lsQzdpg1SPZ1yxFqE4QIHOnXc82';
  
  const trialExpiresAt = new Date();
  trialExpiresAt.setDate(trialExpiresAt.getDate() - 1);

  try {
    await db.collection('shops').doc(shopId).update({
      paymentStatus: 'trial',
      trialExpiresAt: trialExpiresAt,
      status: 'active'
    });
    console.log(`Successfully activated 5-day trial for shop: ${shopId}`);
    console.log(`Trial expires at: ${trialExpiresAt.toISOString()}`);
  } catch (error) {
    console.error('Error updating shop:', error);
  }
}

setTrial().then(() => process.exit(0));
