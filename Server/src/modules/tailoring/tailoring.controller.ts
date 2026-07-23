import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../../shared/utils/response";
import { tailoringService } from "./tailoring.service";

export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const jobs = await tailoringService.getJobs(shopId);
  return sendSuccess(res, jobs, "Tailoring jobs fetched");
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await tailoringService.getJob(String(req.params.id));
  return sendSuccess(res, job, "Tailoring job fetched");
});

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const payload = { ...req.body, shopId };
  const job = await tailoringService.createJob(payload);
  return sendSuccess(res, job, "Tailoring job created", 201);
});

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  await tailoringService.updateJob(String(req.params.id), req.body);
  return sendSuccess(res, null, "Tailoring job updated");
});

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  await tailoringService.deleteJob(String(req.params.id));
  return sendSuccess(res, null, "Tailoring job deleted");
});
