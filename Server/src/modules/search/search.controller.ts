import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../shared/utils/response";
import { searchService } from "./search.service";

export const masterSearch = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const query = req.query.query;

  if (!query || typeof query !== "string") {
    return sendSuccess(res, [], "Search query is empty");
  }

  const results = await searchService.masterSearch(shopId, query);
  return sendSuccess(res, results, "Search results fetched");
});
