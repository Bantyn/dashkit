import { IGstVerificationProvider, GstVerificationResult, GstProviderType } from "./gst-provider.interface";
import { validateGSTIN, validatePAN, validateGstPanConsistency, extractStateCodeFromGstin } from "../../../shared/utils/gstValidator";

export class LocalChecksumProvider implements IGstVerificationProvider {
  providerName: GstProviderType = "LOCAL_CHECKSUM";

  async verifyGstin(gstin: string): Promise<GstVerificationResult> {
    const cleanGstin = (gstin || "").trim().toUpperCase();

    if (!cleanGstin) {
      return {
        success: false,
        gstin: "",
        status: "invalid",
        mode: "LOCAL_CHECKSUM",
        provider: "LOCAL_CHECKSUM",
        error: "GSTIN is required."
      };
    }

    if (cleanGstin.length !== 15) {
      return {
        success: false,
        gstin: cleanGstin,
        status: "invalid",
        mode: "LOCAL_CHECKSUM",
        provider: "LOCAL_CHECKSUM",
        error: "GSTIN must be exactly 15 characters long."
      };
    }

    const stateCode = extractStateCodeFromGstin(cleanGstin);
    if (!stateCode || Number(stateCode) < 1 || Number(stateCode) > 38) {
      return {
        success: false,
        gstin: cleanGstin,
        status: "invalid",
        mode: "LOCAL_CHECKSUM",
        provider: "LOCAL_CHECKSUM",
        error: "Invalid State Code in GSTIN (First 2 digits)."
      };
    }

    const panInGstin = cleanGstin.substring(2, 12);
    if (!validatePAN(panInGstin)) {
      return {
        success: false,
        gstin: cleanGstin,
        status: "invalid",
        mode: "LOCAL_CHECKSUM",
        provider: "LOCAL_CHECKSUM",
        error: "Invalid PAN structure within GSTIN (Characters 3-12)."
      };
    }

    if (!validateGSTIN(cleanGstin)) {
      return {
        success: false,
        gstin: cleanGstin,
        status: "invalid",
        mode: "LOCAL_CHECKSUM",
        provider: "LOCAL_CHECKSUM",
        error: "Invalid GSTIN format or mathematical checksum."
      };
    }

    return {
      success: true,
      gstin: cleanGstin,
      status: "active",
      mode: "LOCAL_CHECKSUM",
      provider: "LOCAL_CHECKSUM",
      legalName: "Self-Declared Business Entity",
      tradeName: "Self-Declared Trade Name"
    };
  }
}
