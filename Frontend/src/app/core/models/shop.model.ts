export interface Shop {
  id: string;
  ownerId: string;
  email: string;
  phone: string;
  shopName: string;
  slug: string;
  subdomainEnabled: boolean;
  customDomain?: string;
  websiteEnabled: boolean;
  displayName: string;
  description: string;
  address: string;
  pickupAddress?: Address;
  gstNumber?: string;
  logo?: string;
  banner?: string;
  status: 'active' | 'suspended' | 'inactive';
  subscriptionPlan: string;
  ownerName?: string;
  selectedPlan?: string;
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'cancelled';
  paymentStatus?: 'pending' | 'active' | 'failed' | 'trial' | 'expired' | 'refunded' | 'past_due';
  billingCycle?: 'monthly' | 'yearly';
  trialStartedAt?: any;
  trialExpiresAt?: any;

  theme: Theme;
  pages: {
    home: boolean;
    products: boolean;
    offers: boolean;
    contact: boolean;
    shippingPolicy?: boolean;
    returnPolicy?: boolean;
    termsAndConditions?: boolean;
    privacyPolicy?: boolean;
    shippingPolicyContent?: string;
    returnPolicyContent?: string;
    termsAndConditionsContent?: string;
    privacyPolicyContent?: string;
  };
  paymentModes?: {
    cod: boolean;
    online: boolean;
    bankTransfer: boolean;
  };
  orderAcceptance?: 'auto' | 'manual' | 'paused';
  taxConfig?: TaxConfig;
  invoiceConfig?: InvoiceConfig;
  upiDetails?: UpiDetails;
  bankDetails?: BankDetails;
  razorpay?: RazorpayConfig;
  integrations?: Integrations;
  seo: SEO;
  socialLinks?: SocialLinks;
  customFeatures?: string[];
  customPrice?: number;
  nextBillingDate?: any;
  // AutoPay / eMandate fields
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  autoPayEnabled?: boolean;
  autoPayStatus?: 'pending_mandate' | 'authenticated' | 'active' | 'paused' | 'halted' | 'cancelling' | 'cancelled';
  autoPayPlanCode?: string;
  autoPayBillingCycle?: 'monthly' | 'yearly';
  autoPayUrl?: string;
  razorpayActivatedAt?: any;
  autoPayCancelledAt?: any;
  lastAutoChargeAt?: any;
  lastAutoChargeAmount?: number;
  
  // Storage usage and limits
  includedStorageMB?: number;
  humanReadableStorage?: string;
  currentStorageBytes?: number;
  currentStorageMB?: number;
  storageAddonEnabled?: boolean;
  storageAddonPlan?: string;
  storageAddonAmount?: number;
  storageBillingCycle?: 'monthly' | 'yearly';
  storageRenewDate?: any;
  lastStorageCalculation?: any;
  storageWarningSent?: '80' | '90' | '100' | null;
  storageLimitReached?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  layout?: string;
  logo?: string;
  banner?: string;
  homepageSettings?: any;
  removeBgEnabled?: boolean;
}

export interface SEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
}

export interface TaxConfig {
  gstEnabled: boolean;
  gstRate: number;
  gstNumber?: string;
  gstType: 'inclusive' | 'exclusive';
  splitGst: boolean;
  igstOnInterstate: boolean;
  gstVerified?: boolean;
  gstStatus?: 'not_configured' | 'pending' | 'verified' | 'failed';
  legalBusinessName?: string;
  panNumber?: string;
  verifiedAt?: any | null;
  verificationError?: string | null;
}


export interface InvoiceConfig {
  prefix: string;
  startingNumber: number;
  showLogo: boolean;
  showQrCode: boolean;
  showGstBreakdown: boolean;
  showSignatureLine: boolean;
  showTermsAndConditions: boolean;
  termsText: string;
  footerText: string;
  accentColor: string;
  templateType: 'default' | 'custom';
}

export interface UpiDetails {
  upiId: string;
  accountName: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch?: string;
}

export interface RazorpayConfig {
  keyId: string;
  keySecret?: string;
  connected: boolean;
  merchantVpa?: string;
}

export interface Integrations {
  whatsapp?: {
    apiKey: string;
    phoneNumberId: string;
    businessAccountId: string;
    connected: boolean;
  };
  twilio?: { accountSid: string; authToken: string; senderNumber: string; connected: boolean };
  cloudinary?: { cloudName: string; apiKey: string; apiSecret: string; connected: boolean };
  awsS3?: {
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    region: string;
    connected: boolean;
  };
  googleCloud?: { projectId: string; credentials: string; bucket: string; connected: boolean };
  smtp?: {
    host: string;
    port: number;
    user: string;
    smtpPass: string;
    fromName: string;
    connected: boolean;
  };
  sendgrid?: { apiKey: string; fromEmail: string; connected: boolean };
  mailgun?: { apiKey: string; domain: string; connected: boolean };
  delhivery?: { apiKey: string; connected: boolean };
  easyEcom?: { apiKey: string; connected: boolean };
  googleAnalytics?: { measurementId: string; connected: boolean };
  metaPixel?: { pixelId: string; connected: boolean };
  hotjar?: { siteId: string; connected: boolean };
  googleMaps?: { apiKey: string; connected: boolean };
}
