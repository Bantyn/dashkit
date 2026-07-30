export type GstVerificationStatus = "SELF_DECLARED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
export type GstVerificationMode = "LOCAL_CHECKSUM" | "SELF_DECLARATION" | "MANUAL_ADMIN" | "SANDBOX_API" | "LIVE_API";
export type GstProviderType = "LOCAL_CHECKSUM" | "SANDBOX" | "SUREPASS" | "ZOOP" | "DECENTRO" | "MASTERS_INDIA";

export interface GstVerificationResult {
  success: boolean;
  gstin: string;
  legalName?: string;
  tradeName?: string;
  status: "active" | "inactive" | "invalid" | "pending";
  mode: GstVerificationMode;
  provider: GstProviderType;
  rawResponse?: any;
  error?: string;
}

export interface IGstVerificationProvider {
  providerName: GstProviderType;
  verifyGstin(gstin: string): Promise<GstVerificationResult>;
}
