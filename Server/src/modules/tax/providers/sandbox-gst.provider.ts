import axios from "axios";
import { IGstVerificationProvider, GstVerificationResult, GstProviderType } from "./gst-provider.interface";
import { validateGSTIN } from "../../../shared/utils/gstValidator";

export class SandboxGstProvider implements IGstVerificationProvider {
  providerName: GstProviderType = "SANDBOX";

  private async getAccessToken(): Promise<string | null> {
    const apiKey = process.env.SANDBOX_API_KEY;
    const apiSecret = process.env.SANDBOX_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      console.warn("[SandboxGSTProvider] Sandbox credentials missing. Falling back to local validation.");
      return null;
    }

    try {
      const response = await axios.post(
        "https://api.sandbox.co.in/authenticate",
        {},
        {
          headers: {
            "x-api-key": apiKey,
            "x-api-secret": apiSecret,
            "x-api-version": "1.0.0",
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (
        response.data &&
        (response.data.code === 200 || response.data.code === 201) &&
        response.data.data?.access_token
      ) {
        return response.data.data.access_token;
      }
      return null;
    } catch (err: any) {
      console.error("[SandboxGSTProvider] Auth failed:", err.message);
      return null;
    }
  }

  async verifyGstin(gstin: string): Promise<GstVerificationResult> {
    const cleanGstin = (gstin || "").trim().toUpperCase();

    if (!validateGSTIN(cleanGstin)) {
      return {
        success: false,
        gstin: cleanGstin,
        status: "invalid",
        mode: "SANDBOX_API",
        provider: "SANDBOX",
        error: "Invalid GSTIN format."
      };
    }

    const apiKey = process.env.SANDBOX_API_KEY;
    const accessToken = await this.getAccessToken();

    if (!accessToken || !apiKey) {
      // Fallback to active state if local validation passes when Sandbox API is disabled/unconfigured
      return {
        success: true,
        gstin: cleanGstin,
        status: "active",
        mode: "LOCAL_CHECKSUM",
        provider: "SANDBOX",
        legalName: "Self-Declared Business Entity (API Unconfigured Fallback)"
      };
    }

    try {
      const response = await axios.post(
        "https://api.sandbox.co.in/gst/compliance/public/gstin/search",
        { gstin: cleanGstin },
        {
          headers: {
            "x-api-key": apiKey,
            authorization: accessToken,
            "x-api-version": "1.0",
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const dataResponse = response.data?.data || response.data;
      const apiStatus = (dataResponse?.status || "Active").toLowerCase();

      if (apiStatus === "active" || response.data?.code === 200) {
        return {
          success: true,
          gstin: cleanGstin,
          status: "active",
          mode: "SANDBOX_API",
          provider: "SANDBOX",
          legalName: dataResponse?.legalName || "Verified Business Entity",
          tradeName: dataResponse?.tradeName,
          rawResponse: response.data
        };
      }

      return {
        success: false,
        gstin: cleanGstin,
        status: "inactive",
        mode: "SANDBOX_API",
        provider: "SANDBOX",
        error: `GST registration status is '${dataResponse?.status}'. Only Active GST accounts accepted.`
      };
    } catch (error: any) {
      console.error("[SandboxGSTProvider] API call error:", error.message);
      return {
        success: true,
        gstin: cleanGstin,
        status: "active",
        mode: "LOCAL_CHECKSUM",
        provider: "SANDBOX",
        legalName: "Self-Declared Business Entity (API Error Fallback)"
      };
    }
  }
}
