import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { mediaService } from "./media.service";
import { ValidationError } from "../../shared/utils/errors";

export const uploadMedia = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      throw new ValidationError("No file uploaded");
    }

    const shopId = req.shopId;
    if (!shopId) {
      throw new ValidationError("Shop context is missing");
    }

    const url = await mediaService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      shopId
    );

    return res.status(200).json({
      message: "Image uploaded successfully",
      data: {
        url,
      },
    });
  } catch (err: any) {
    console.error("uploadMedia error:", err);
    const status = err.statusCode || 500;
    return res.status(status).json({
      message: err.message || "Failed to upload image",
    });
  }
};

export const deleteMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    const shopId = req.shopId;
    if (!url) {
      throw new ValidationError("File URL is required");
    }
    if (!shopId) {
      throw new ValidationError("Shop context is missing");
    }

    await mediaService.deleteFile(url, shopId);

    return res.status(200).json({
      message: "Media deleted successfully",
    });
  } catch (err: any) {
    console.error("deleteMedia error:", err);
    const status = err.statusCode || 500;
    return res.status(status).json({
      message: err.message || "Failed to delete media",
    });
  }
};

export const scanOrphanMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { orphanCleanerService } = await import("./orphan-cleaner.service");
    const dryRun = req.body?.dryRun !== false; // Default to dryRun: true for safety
    const shopId = req.body?.shopId || req.shopId;

    const report = await orphanCleanerService.scanAndClean({
      dryRun,
      shopId: shopId ? String(shopId) : undefined,
      batchSize: req.body?.batchSize,
    });

    return res.status(200).json({
      message: `Orphan media scan completed (${dryRun ? "Dry-Run" : "Live"})`,
      data: report,
    });
  } catch (err: any) {
    console.error("scanOrphanMedia error:", err);
    const status = err.statusCode || 500;
    return res.status(status).json({
      message: err.message || "Failed to scan orphan media",
    });
  }
};
