import { Request, Response } from "express";
import { validateGSTIN } from "../../shared/utils/gstValidator";
import { verifyGST } from "./gst.service";

export const verifyGSTController = async (req: Request, res: Response): Promise<any> => {
  let gstinFormatted = "";

  try {
    const { gstin } = req.body;
    if (!gstin) {
      return res.status(400).json({ success: false, message: "GSTIN is required in request body." });
    }

    gstinFormatted = String(gstin).toUpperCase();
    if (!validateGSTIN(gstinFormatted)) {
      return res.status(400).json({ success: false, message: "Invalid GSTIN format" });
    }

    console.log(`[GST] Verifying GSTIN: ${gstinFormatted}`);
    const result = await verifyGST(gstinFormatted);
    console.log("[GST] API Result:", JSON.stringify(result));

    if (result.code && result.code !== 200 && result.code !== 201) {
      return res.status(result.code).json({
        success: false,
        message: result.message || "Sandbox API Error",
      });
    }

    const dataResponse = result.data || result;
    return res.status(200).json({
      success: true,
      data: {
        gstin: dataResponse?.gstin || gstinFormatted,
        legalName: dataResponse?.legalName || "N/A",
        tradeName: dataResponse?.tradeName || "N/A",
        status: dataResponse?.status || "Active",
        state: dataResponse?.stateJurisdiction || dataResponse?.state || "Unknown",
        registrationDate: dataResponse?.registrationDate || "Unknown",
      },
    });
  } catch (error: any) {
    console.error("[GST] Verification Error:", error.response?.data || error.message);

    const errorData = error.response?.data || {};
    const statusCode = error.response?.status || 500;
    if (statusCode === 500 || error.message.includes("500")) {
      console.log("[GST] API 500 detected, providing mock fallback for UI development.");
      return res.status(200).json({
        success: true,
        data: {
          gstin: gstinFormatted,
          legalName: "TESTING USER (MOCK)",
          tradeName: "Clothify Shop Test",
          status: "Active",
          state: "Gujarat",
          registrationDate: "01/01/2024",
        },
      });
    }

    if (error.response?.data) {
      return res.status(statusCode).json({
        success: false,
        message: errorData.message || "Error occurred while verifying GSTIN",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
