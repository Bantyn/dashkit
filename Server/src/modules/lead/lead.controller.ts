import { Request, Response } from "express";
import { db } from "../../config/firebase.config";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { Lead } from "./lead.model";

const COLLECTION = "leads";

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, shopName, message, type } = req.body;

  if (!name || !email || !phone || !shopName || !type) {
    return sendError(res, "Missing required fields", 400);
  }

  if (type !== "contact" && type !== "demo" && type !== "enterprise") {
    return sendError(res, "Invalid lead type", 400);
  }

  const lead: Lead = {
    name,
    email,
    phone,
    shopName,
    message: message || "",
    type,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const docRef = await db.collection(COLLECTION).add(lead);

  return sendSuccess(res, { id: docRef.id, ...lead }, "Lead submitted successfully");
});

export const getLeads = asyncHandler(async (req: Request, res: Response) => {
  const { type, status } = req.query;

  let query: any = db.collection(COLLECTION);

  if (typeof type === "string") {
    query = query.where("type", "==", type);
  }
  if (typeof status === "string") {
    query = query.where("status", "==", status);
  }

  const snapshot = await query.get();
  const leads: Lead[] = [];

  snapshot.forEach((doc: any) => {
    leads.push({ id: doc.id, ...doc.data() } as Lead);
  });

  // Sort in-memory descending by createdAt
  leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return sendSuccess(res, leads, "Leads retrieved successfully");
});

export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["pending", "contacted", "resolved"].includes(status)) {
    return sendError(res, "Invalid or missing status value", 400);
  }

  const leadRef = db.collection(COLLECTION).doc(id as string);
  const doc = await leadRef.get();

  if (!doc.exists) {
    return sendError(res, "Lead not found", 404);
  }

  await leadRef.update({ status });

  return sendSuccess(res, null, "Lead status updated successfully");
});

export const deleteLead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const leadRef = db.collection(COLLECTION).doc(id as string);
  const doc = await leadRef.get();

  if (!doc.exists) {
    return sendError(res, "Lead not found", 404);
  }

  await leadRef.delete();

  return sendSuccess(res, null, "Lead deleted successfully");
});
