import { IGstVerificationProvider, GstVerificationResult, GstProviderType } from "./providers/gst-provider.interface";
import { LocalChecksumProvider } from "./providers/local-checksum.provider";
import { SandboxGstProvider } from "./providers/sandbox-gst.provider";

export class GstVerificationService {
  private providers: Map<GstProviderType, IGstVerificationProvider> = new Map();
  private activeProviderName: GstProviderType = "LOCAL_CHECKSUM";

  constructor() {
    this.registerProvider(new LocalChecksumProvider());
    this.registerProvider(new SandboxGstProvider());

    const configuredProvider = (process.env.GST_PROVIDER || "LOCAL_CHECKSUM").toUpperCase() as GstProviderType;
    if (this.providers.has(configuredProvider)) {
      this.activeProviderName = configuredProvider;
    } else {
      this.activeProviderName = "LOCAL_CHECKSUM";
    }
  }

  public registerProvider(provider: IGstVerificationProvider): void {
    this.providers.set(provider.providerName, provider);
  }

  public setProvider(providerName: GstProviderType): void {
    if (this.providers.has(providerName)) {
      this.activeProviderName = providerName;
    } else {
      throw new Error(`GST Provider '${providerName}' is not registered.`);
    }
  }

  public getActiveProvider(): IGstVerificationProvider {
    const provider = this.providers.get(this.activeProviderName);
    if (!provider) {
      return this.providers.get("LOCAL_CHECKSUM")!;
    }
    return provider;
  }

  public async verifyGSTIN(gstin: string, overrideProvider?: GstProviderType): Promise<GstVerificationResult> {
    const provider = overrideProvider && this.providers.has(overrideProvider)
      ? this.providers.get(overrideProvider)!
      : this.getActiveProvider();

    return provider.verifyGstin(gstin);
  }
}

export const gstVerificationService = new GstVerificationService();

/**
 * Backward compatibility wrapper for existing call sites.
 */
export const verifyGST = async (gstin: string): Promise<any> => {
  const result = await gstVerificationService.verifyGSTIN(gstin);
  if (!result.success) {
    return {
      code: 400,
      message: result.error || "GST Verification failed.",
      data: null
    };
  }
  return {
    code: 200,
    message: "GSTIN verified successfully",
    data: {
      gstin: result.gstin,
      status: result.status === "active" ? "Active" : "Inactive",
      legalName: result.legalName || "Self-Declared Business Entity",
      tradeName: result.tradeName || "Self-Declared Trade Name",
      taxpayerType: "Regular"
    }
  };
};
