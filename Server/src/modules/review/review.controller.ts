import { Request, Response } from "express";
import { db } from "../../config/firebase.config";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { Review } from "./review.model";
import { createNotification } from "../notification/notification.controller";

export const addReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.shop) {
    return sendError(res, "Shop context not found", 404);
  }

  const { productId, customerName, rating, comment, images } = req.body;
  const customerId = req.body.customerId || "guest";

  let isVerifiedPurchase = false;
  
  if (customerId !== "guest") {
    // 1. Check if already reviewed
    const existingReview = await db.collection("reviews")
      .where("shopId", "==", req.shop.id)
      .where("productId", "==", productId)
      .where("customerId", "==", customerId)
      .get();
      
    if (!existingReview.empty) {
      return sendError(res, "You have already submitted a review for this product.", 400);
    }

    // 2. Check if product is delivered
    const orders = await db.collection("orders")
      .where("shopId", "==", req.shop.id)
      .where("customerId", "==", customerId)
      .where("orderStatus", "==", "delivered")
      .get();
      
    for (const doc of orders.docs) {
      const order = doc.data();
      if (order.products && order.products.some((p: any) => p.productId === productId)) {
        isVerifiedPurchase = true;
        break;
      }
    }
  }

  const newReview: Review = {
    id: "",
    shopId: req.shop.id,
    productId,
    customerId,
    customerName,
    rating,
    comment,
    images: images || [],
    isVerifiedPurchase,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await db.collection("reviews").add(newReview);
  newReview.id = docRef.id;
  await docRef.update({ id: docRef.id });

  await createNotification({
    shopId: req.shop.id,
    title: "New Customer Review",
    message: `${customerName} rated ${rating}⭐ - "${(comment || '').substring(0, 50)}${(comment || '').length > 50 ? '...' : ''}",`,
    type: "review",
    link: `/${req.shop.id}/reviews`,
  });

  return sendSuccess(res, newReview, "Review added successfully");
});

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  if (!req.shop) {
    return sendError(res, "Shop context not found", 404);
  }

  const snapshot = await db
    .collection("reviews")
    .where("shopId", "==", req.shop.id)
    .where("productId", "==", req.params.productId)
    .where("status", "==", "approved")
    .get();

  return sendSuccess(res, snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as Review), "Reviews fetched successfully");
});

export const getAllReviews = asyncHandler(async (req: Request, res: Response) => {
  const shopId = (req as any).user?.shopId || req.params?.shopId;
  
  if (!shopId) {
    return sendError(res, "Shop context not found", 404);
  }

  const snapshot = await db
    .collection("reviews")
    .where("shopId", "==", shopId)
    .get();

  const reviews = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data() as Review);

  reviews.sort((a: Review, b: Review) => {
    const timeA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate().getTime() : new Date(a.createdAt as any).getTime();
    const timeB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate().getTime() : new Date(b.createdAt as any).getTime();
    return timeB - timeA;
  });

  return sendSuccess(res, reviews, "Reviews fetched successfully");
});

export const updateReviewStatus = asyncHandler(async (req: Request, res: Response) => {
  const shopId = (req as any).user?.shopId || req.params?.shopId;
  const reviewId = req.params.reviewId;
  const { status } = req.body;
  
  if (!shopId) {
    return sendError(res, "Shop context not found", 404);
  }
  
  if (!reviewId || !status) {
    return sendError(res, "Review ID and status are required", 400);
  }

  const reviewRef = db.collection("reviews").doc(reviewId as string);
  const doc = await reviewRef.get();
  
  if (!doc.exists) {
    return sendError(res, "Review not found", 404);
  }
  
  if (doc.data()?.shopId !== shopId) {
    return sendError(res, "Unauthorized to update this review", 403);
  }

  await reviewRef.update({ 
    status,
    updatedAt: new Date()
  });

  return sendSuccess(res, { id: reviewId, status }, "Review status updated successfully");
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const shopId = (req as any).user?.shopId || req.params?.shopId;
  const reviewId = req.params.reviewId;
  
  if (!shopId) {
    return sendError(res, "Shop context not found", 404);
  }

  if (!reviewId) {
    return sendError(res, "Review ID is required", 400);
  }

  const reviewRef = db.collection("reviews").doc(reviewId as string);
  const doc = await reviewRef.get();
  
  if (!doc.exists) {
    return sendError(res, "Review not found", 404);
  }
  
  if (doc.data()?.shopId !== shopId) {
    return sendError(res, "Unauthorized to delete this review", 403);
  }

  await reviewRef.delete();

  return sendSuccess(res, null, "Review deleted successfully");
});
