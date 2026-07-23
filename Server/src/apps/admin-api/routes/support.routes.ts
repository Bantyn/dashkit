import { Router } from "express";
import { createSupportTicket, getSupportTickets, replyToTicket, closeTicket } from "../../../modules/support/support.controller";

const router = Router();

// Public (shop creates ticket - uses shop's auth token)
router.post("/", createSupportTicket);

// Admin only
router.get("/", getSupportTickets);
router.post("/:ticketId/reply", replyToTicket);
router.post("/:ticketId/close", closeTicket);

export default router;
