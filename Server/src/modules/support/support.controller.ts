import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { supportService } from "./support.service";

export const createSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const { shopId, shopName, reporterEmail, subject, description } = req.body;
  if (!shopId || !reporterEmail || !subject || !description) {
    return sendError(res, "shopId, reporterEmail, subject and description are required", 400);
  }
  const ticket = await supportService.createTicket({ shopId, shopName: shopName || "Unknown Shop", reporterEmail, subject, description });
  return sendSuccess(res, ticket, "Support ticket submitted successfully");
});

export const getSupportTickets = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query["status"] as string | undefined;
  const tickets = await supportService.getTickets(status);
  return sendSuccess(res, tickets, "Tickets fetched");
});

export const replyToTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticketId = String(req.params["ticketId"]);
  const { adminReply } = req.body;
  const adminEmail = (req as any).user?.email || "admin@clothify.com";
  if (!adminReply) return sendError(res, "adminReply is required", 400);
  await supportService.replyToTicket(ticketId, adminReply, adminEmail);
  return sendSuccess(res, null, "Reply sent successfully");
});

export const closeTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticketId = String(req.params["ticketId"]);
  await supportService.closeTicket(ticketId);
  return sendSuccess(res, null, "Ticket closed");
});
