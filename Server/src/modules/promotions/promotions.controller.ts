import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { db } from "../../config/firebase.config";
import { Promotion } from "./promotion.model";

const COLLECTION = "promotions";

export const createPromotion = asyncHandler(async (req: Request, res: Response) => {
  const promotion: Promotion = {
    ...req.body,
    isActive: req.body.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
    startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
    endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
  };

  const ref = db.collection(COLLECTION).doc();
  promotion.id = ref.id;
  await ref.set(promotion);
  return sendSuccess(res, promotion, "Promotion created successfully", 201);
});

export const getPromotionsByShop = asyncHandler(async (req: Request, res: Response) => {
  const snapshot = await db.collection(COLLECTION).where("shopId", "==", String(req.params.shopId)).get();
  return sendSuccess(res, snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as Promotion), "Shop promotions fetched successfully");
});

export const getPromotion = asyncHandler(async (req: Request, res: Response) => {
  const docSnap = await db.collection(COLLECTION).doc(String(req.params.id)).get();
  if (!docSnap.exists) return sendError(res, "Promotion not found", 404);
  return sendSuccess(res, docSnap.data(), "Promotion fetched successfully");
});

export const updatePromotion = asyncHandler(async (req: Request, res: Response) => {
  const docRef = db.collection(COLLECTION).doc(String(req.params.id));
  const docSnap = await docRef.get();
  if (!docSnap.exists) return sendError(res, "Promotion not found", 404);

  const updates: any = { ...req.body, updatedAt: new Date() };
  if (updates.startDate) updates.startDate = new Date(updates.startDate);
  if (updates.endDate) updates.endDate = new Date(updates.endDate);

  await docRef.update(updates);
  const updatedSnap = await docRef.get();
  return sendSuccess(res, updatedSnap.data(), "Promotion updated successfully");
});

export const deletePromotion = asyncHandler(async (req: Request, res: Response) => {
  const docRef = db.collection(COLLECTION).doc(String(req.params.id));
  const docSnap = await docRef.get();
  if (!docSnap.exists) return sendError(res, "Promotion not found", 404);
  await docRef.delete();
  return sendSuccess(res, null, "Promotion deleted successfully");
});

export const activateCampaign = asyncHandler(async (req: Request, res: Response) => {
  const docRef = db.collection(COLLECTION).doc(String(req.params.id));
  const docSnap = await docRef.get();
  if (!docSnap.exists) return sendError(res, "Campaign not found", 404);
  
  const campaign = docSnap.data() as Promotion;
  if (campaign.type !== "sms" && campaign.type !== "whatsapp") {
    // Only SMS/WhatsApp trigger messaging queue for now
    await docRef.update({ isActive: true, status: 'running', updatedAt: new Date() });
    return sendSuccess(res, null, "Campaign activated");
  }

  // Handle messaging campaigns
  const audience = req.body.audience || []; // array of phone numbers
  if (!audience.length) return sendError(res, "Audience is empty", 400);

  const batch = db.batch();
  
  for (const phone of audience) {
    const msgRef = db.collection("campaign_messages").doc();
    batch.set(msgRef, {
      id: msgRef.id,
      campaignId: campaign.id,
      shopId: campaign.shopId,
      type: campaign.type,
      recipient: phone,
      content: req.body.templateContent || campaign.description,
      status: "pending",
      createdAt: new Date()
    });
  }

  await docRef.update({ 
    isActive: true, 
    status: 'running', 
    updatedAt: new Date() 
  });
  
  await batch.commit();

  return sendSuccess(res, { queuedCount: audience.length }, "Campaign activated and messages queued");
});

export const getCampaignAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const campaignId = String(req.params.id);
  
  const snap = await db.collection("campaign_messages").where("campaignId", "==", campaignId).get();
  
  const analytics = {
    total: snap.size,
    pending: 0,
    delivered: 0,
    failed: 0
  };

  snap.forEach((doc: any) => {
    const status = doc.data().status;
    if (status === 'pending') analytics.pending++;
    if (status === 'delivered') analytics.delivered++;
    if (status === 'failed') analytics.failed++;
  });

  return sendSuccess(res, analytics, "Analytics fetched");
});
