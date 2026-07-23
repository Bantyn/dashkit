import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { db } from "../../config/firebase.config";
import { CreditPack } from "./wallet.model";
import { FieldValue } from "firebase-admin/firestore";

const WALLET_COLLECTION = "credit_wallets";
const PACK_COLLECTION = "credit_packs";
const TX_COLLECTION = "credit_transactions";

// Admin methods for Packs
export const createCreditPack = asyncHandler(async (req: Request, res: Response) => {
  const pack: CreditPack = {
    ...req.body,
    isActive: req.body.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ref = db.collection(PACK_COLLECTION).doc();
  pack.id = ref.id;
  await ref.set(pack);
  return sendSuccess(res, pack, "Credit pack created", 201);
});

export const updateCreditPack = asyncHandler(async (req: Request, res: Response) => {
  const docRef = db.collection(PACK_COLLECTION).doc(String(req.params.id));
  const docSnap = await docRef.get();
  if (!docSnap.exists) return sendError(res, "Pack not found", 404);

  const updates = { ...req.body, updatedAt: new Date() };
  await docRef.update(updates);
  return sendSuccess(res, { id: docRef.id, ...updates }, "Credit pack updated");
});

export const getCreditPacks = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type as string;
  let query: FirebaseFirestore.Query = db.collection(PACK_COLLECTION);
  
  if (type) {
    query = query.where("type", "==", type);
  }
  
  const snapshot = await query.get();
  const packs = snapshot.docs.map((doc: any) => doc.data() as CreditPack);
  return sendSuccess(res, packs, "Packs fetched");
});

export const deleteCreditPack = asyncHandler(async (req: Request, res: Response) => {
  await db.collection(PACK_COLLECTION).doc(String(req.params.id)).delete();
  return sendSuccess(res, null, "Pack deleted");
});

// Shop methods for Wallet
export const getShopWallet = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const docRef = db.collection(WALLET_COLLECTION).doc(shopId);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    // Return empty wallet if not created yet
    return sendSuccess(res, { shopId, smsCredits: 0, whatsappCredits: 0 }, "Wallet fetched");
  }
  
  return sendSuccess(res, docSnap.data(), "Wallet fetched");
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  
  const snapshot = await db.collection(TX_COLLECTION)
    .where("shopId", "==", shopId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
    
  return sendSuccess(res, snapshot.docs.map((doc: any) => doc.data()), "Transactions fetched");
});

export const createWalletOrder = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const { packId } = req.body;
  
  if (!packId) return sendError(res, "Pack ID is required", 400);

  const packSnap = await db.collection(PACK_COLLECTION).doc(packId).get();
  if (!packSnap.exists) return sendError(res, "Pack not found", 404);
  
  const pack = packSnap.data() as CreditPack;

  const { PaymentService } = await import("../subscription/payment.service");
  const paymentService = new PaymentService();
  const razorpay = await paymentService.getRazorpayInstance();

  const amountInPaise = Math.round(pack.price * 100);

  const options = {
    amount: amountInPaise,
    currency: "INR",
    receipt: `wp_${shopId.substring(0, 10)}_${Date.now()}`.substring(0, 40),
    notes: {
      shopId,
      packId,
      type: "wallet_pack"
    }
  };

  const order = await razorpay.orders.create(options);
  
  const { platformSettingsService } = await import("../platform-settings/platform-settings.service");
  const billingSettings = await platformSettingsService.getBillingSettings();

  return sendSuccess(res, {
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: billingSettings.razorpayKeyId
  }, "Order created successfully");
});

export const verifyWalletPayment = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const { packId, paymentId, orderId, signature } = req.body;
  
  if (!packId || !paymentId || !orderId || !signature) {
    return sendError(res, "Missing payment details", 400);
  }

  const { platformSettingsService } = await import("../platform-settings/platform-settings.service");
  const billingSettings = await platformSettingsService.getBillingSettings();
  const key_secret = billingSettings.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

  if (!key_secret) {
    return sendError(res, "Razorpay credentials not configured", 500);
  }

  const crypto = await import("crypto");
  const generated_signature = crypto
    .createHmac("sha256", key_secret as string)
    .update(orderId + "|" + paymentId)
    .digest("hex");

  if (generated_signature !== signature) {
    return sendError(res, "Payment verification failed. Invalid signature.", 400);
  }

  const packSnap = await db.collection(PACK_COLLECTION).doc(packId).get();
  if (!packSnap.exists) return sendError(res, "Pack not found", 404);
  const pack = packSnap.data() as CreditPack;

  const walletRef = db.collection(WALLET_COLLECTION).doc(shopId);
  const txRef = db.collection(TX_COLLECTION).doc();

  await db.runTransaction(async (transaction: any) => {
    const walletDoc = await transaction.get(walletRef);
    
    if (!walletDoc.exists) {
      transaction.set(walletRef, {
        shopId,
        smsCredits: pack.type === 'sms' ? pack.credits : 0,
        whatsappCredits: pack.type === 'whatsapp' ? pack.credits : 0,
        updatedAt: new Date()
      });
    } else {
      const updateField = pack.type === 'sms' ? 'smsCredits' : 'whatsappCredits';
      transaction.update(walletRef, {
        [updateField]: FieldValue.increment(pack.credits),
        updatedAt: new Date()
      });
    }

    transaction.set(txRef, {
      id: txRef.id,
      shopId,
      type: pack.type,
      amount: pack.credits,
      description: `Purchased ${pack.name}`,
      referenceId: paymentId,
      createdAt: new Date()
    });
  });

  return sendSuccess(res, { success: true }, "Credits added successfully");
});
