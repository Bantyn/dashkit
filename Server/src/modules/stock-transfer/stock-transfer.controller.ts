import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../shared/utils/response";
import { stockTransferService } from "./stock-transfer.service";

export const getTransfers = asyncHandler(async (req: Request, res: Response) => {
  const transfers = await stockTransferService.getTransfers(String(req.params.shopId));
  return sendSuccess(res, transfers, "Stock transfers fetched successfully");
});

export const createTransfer = asyncHandler(async (req: Request, res: Response) => {
  const performerId = (req as any).user?.uid || "admin";
  const transfer = await stockTransferService.createTransfer({
    ...req.body,
    createdBy: performerId,
  });
  return sendSuccess(res, transfer, "Stock transfer completed successfully");
});
