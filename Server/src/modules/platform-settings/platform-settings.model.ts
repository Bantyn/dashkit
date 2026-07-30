export interface PlatformGeneralSettings {
  platformName: string;
  supportEmail: string;
  adminEmail: string;
  updatedAt: Date;
}

export interface DashboardThemePalette {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  fontFamily: string;
  radius: string;
}

export interface PlatformThemeSettings {
  admin: DashboardThemePalette;
  shop: DashboardThemePalette;
  website: DashboardThemePalette;
  updatedAt: Date;
}

export interface PlatformBillingSettings {
  gatewayProvider: string;
  currency: string;
  autoPayEnabled: boolean;
  autoPayProvider: string;
  autoPayGraceDays: number;
  retryAttempts: number;
  retryIntervalDays: number;
  testMode: boolean;
  webhookSecret?: string;
  webhookEndpoint?: string;
  callbackUrl?: string;
  apiBaseUrl?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  supportedMethods: string[];
  transactionFeePercent: number;
  autoPayTotalCount?: number;
  updatedAt: Date;
}

export type PlatformGstStatus =
  | "not_configured"
  | "pending"
  | "verified"
  | "failed"
  | "suspended";

export type GstVerificationStatus = "SELF_DECLARED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
export type GstVerificationMode = "LOCAL_CHECKSUM" | "SELF_DECLARATION" | "MANUAL_ADMIN" | "SANDBOX_API" | "LIVE_API";
export type GstProviderType = "LOCAL_CHECKSUM" | "SANDBOX" | "SUREPASS" | "ZOOP" | "DECENTRO" | "MASTERS_INDIA";

export interface ShopGstProfile {
  isGstRegistered: boolean;
  gstin: string;
  legalName: string;
  tradeName?: string;
  businessType?: string;
  compositionScheme?: boolean;
  verificationStatus: GstVerificationStatus;
  verificationMode: GstVerificationMode;
  verificationProvider: GstProviderType;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  certificateUrl?: string | null;
  certificateUploadedAt?: Date | null;
  rejectionReason?: string | null;
  selfDeclarationAccepted: boolean;
  selfDeclarationAcceptedAt?: Date | null;
}

export interface PlatformGstSettings {
  // Business Identity
  gstNumber: string;
  legalBusinessName: string;
  panNumber: string;
  businessType: string;

  // Verification State
  gstStatus: PlatformGstStatus;
  gstVerified: boolean;
  gstCollectionEnabled: boolean;

  // Provider & Mode Details (V2 Architecture)
  verificationStatus?: GstVerificationStatus;
  verificationMode?: GstVerificationMode;
  verificationProvider?: GstProviderType;
  selfDeclarationAccepted?: boolean;
  selfDeclarationAcceptedAt?: Date | null;
  certificateUrl?: string | null;
  certificateUploadedAt?: Date | null;
  rejectionReason?: string | null;

  // Verification Audit
  verifiedAt: Date | null;
  verifiedBy: string | null;
  lastVerificationAttempt: Date | null;
  verificationError: string | null;

  // Registered Address
  businessAddress: string;
  state: string;
  stateCode: string;
  city: string;
  pincode: string;
  country: string;

  // Contact
  email: string;
  phone: string;

  // Optional Identifiers
  cin?: string | null;
  msmeNumber?: string | null;
  iec?: string | null;

  // GST Rate applied on platform subscriptions (default 18%)
  gstRate: number;

  // Audit
  updatedAt: Date;
  updatedBy: string;
}

export interface PlatformCostSettings {
  safeReads: number;
  warningReads: number;
  highReads: number;
  criticalReads: number;
  updatedAt: Date;
  updatedBy: string;
}

export interface PlatformTelemetrySettings {
  enabled: boolean;
  updatedAt: Date;
  updatedBy: string;
}

export interface PlatformStorageSettings {
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  awsS3: {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  updatedAt: Date;
  updatedBy: string;
}

export interface PlatformIntegrationSettings {
  whatsapp: {
    provider: string;
    apiKey: string;
    phoneNumberId: string;
    wabaId: string;
  };
  shipping: {
    provider: string;
    apiKey: string;
    apiSecret?: string;
  };
  sms: {
    provider: string;
    apiKey: string;
    senderId?: string;
  };
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  updatedAt: Date;
  updatedBy: string;
}
