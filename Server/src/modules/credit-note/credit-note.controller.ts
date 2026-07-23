import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { creditNoteService } from "./credit-note.service";

export const createCreditNote = asyncHandler(async (req: Request, res: Response) => {
  const cn = await creditNoteService.createCreditNote(req.body);
  return sendSuccess(res, cn, "Credit note created");
});

export const getCreditNotesByShop = asyncHandler(async (req: Request, res: Response) => {
  const cns = await creditNoteService.getCreditNotesByShop(String(req.params.shopId));
  return sendSuccess(res, cns, "Credit notes fetched");
});

export const updateCreditNoteStatus = asyncHandler(async (req: Request, res: Response) => {
  await creditNoteService.updateCreditNoteStatus(String(req.params.id), req.body.status);
  return sendSuccess(res, null, "Credit note status updated");
});

export const convertToCredit = asyncHandler(async (req: Request, res: Response) => {
  try {
    const cn = await creditNoteService.convertToCredit(String(req.params.id));
    return sendSuccess(res, cn, "Converted to store credit successfully");
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
});
