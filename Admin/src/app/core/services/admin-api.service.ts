import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

type ShopStatus = 'active' | 'suspended' | 'inactive';

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

export type AdminShop = {
  id: string;
  shopName: string;
  displayName?: string;
  email?: string;
  phone?: string;
  subdomain?: string;
  gstNumber?: string;
  address?: string;
  status: ShopStatus;
  subscriptionPlan?: string;
  selectedPlan?: string;
  subscriptionStatus?: string;
  paymentStatus?: string;
  trialDays?: number;
  trialExpiresAt?: any;
  trialStartedAt?: any;
  customFeatures?: string[];
  customPrice?: number;
  features?: string[];
  additionalLimits?: Record<string, number>;
  limitPurchases?: Array<{
    limitKey: string;
    incrementAmount: number;
    amountPaid: number;
    paymentId: string;
    purchasedAt: any;
  }>;
  createdAt?: any;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  autoPayEnabled?: boolean;
  autoPayStatus?: string;
  autoPayPlanCode?: string;
  autoPayBillingCycle?: string;
  autoPayActivatedAt?: any;
  autoPayCancelledAt?: any;
  lastAutoChargeAt?: any;
  lastAutoChargeAmount?: number;
  nextBillingDate?: any;
  includedStorageMB?: number;
  currentStorageBytes?: number;
  currentStorageMB?: number;
  storageAddonEnabled?: boolean;
  storageAddonPlan?: string;
  storageAddonAmount?: number;
  storageBillingCycle?: string;
  storageRenewDate?: any;
  lastStorageCalculation?: any;
  storageWarningSent?: string | null;
  storageLimitReached?: boolean;
  taxConfig?: TaxConfig;
};


export type AdminOverview = {
  cards: {
    totalShops: number;
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalInvoices: number;
    activeShops: number;
    suspendedShops: number;
    paidShops?: number;
    freePlanShops?: number;
    monthlyRecurringRevenue?: number;
  };
  recentShops: Array<{
    id: string;
    shopName: string;
    ownerId?: string;
    subscriptionPlan: string;
    status: string;
    createdAt?: string | Date;
  }>;
  backendHealth?: {
    collectionFootprint: Record<string, number>;
    monthlyActivity: Record<string, number>;
    cachePolicy: Record<string, number>;
  } | null;
  subscriptionInsights?: {
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    paidShops: number;
    freePlanShops: number;
    planMix: Array<{
      planCode: string;
      shops: number;
      monthlyRevenue: number;
    }>;
    revenueByShop: Array<{
      id: string;
      shopName: string;
      status: string;
      subscriptionPlan: string;
      planName: string;
      monthlyRevenue: number;
      yearlyRevenue: number;
      createdAt?: string | Date;
    }>;
  } | null;
  sparklines?: {
    revenue: number[];
    shops: number[];
    users: number[];
    orders: number[];
    invoices: number[];
    shopsGrowth: number[];
    usersGrowth: number[];
  };
};

export type AdminUser = {
  uid: string;
  name: string;
  displayName: string;
  email: string;
  mobile?: string;
  shopId?: string;
  roleId?: string | null;
  planId?: string;
  isActive: boolean;
  isBlocked: boolean;
  kycStatus?: string;
  lastLogin?: string | Date;
  permissions?: string[];
  createdAt?: string | Date;
};

export type SupportTicket = {
  id: string;
  shopId: string;
  shopName: string;
  reporterEmail: string;
  subject: string;
  description: string;
  status: 'open' | 'replied' | 'closed';
  adminReply?: string;
  repliedAt?: string | Date;
  createdAt: string | Date;
};

export type FeatureRecord = {
  key: string;
  label: string;
  category:
    | 'core'
    | 'website'
    | 'selling'
    | 'inventory'
    | 'analytics'
    | 'marketing'
    | 'integrations'
    | 'enterprise'
    | 'accounting'
    | 'crm'
    | 'customers'
    | 'staff'
    | 'finance'
    | 'shipping';
  description?: string;
  active: boolean;
  status?: 'active' | 'inactive' | 'maintenance' | 'deprecated';
};

export type RoleRecord = {
  id: string;
  name: string;
  permissions: string[];
};

export type SubscriptionPlanRecord = {
  id: string;
  code: string;
  name: string;
  description: string;
  price?: number | null;
  monthlyPrice: number | null;
  yearlyPrice?: number | null;
  badge?: string;
  targetAudience?: string;
  capabilityLabel?: string;
  color?: string;
  bgColor?: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  features: string[];
  limits?: Record<string, number | null | undefined>;
  limitations?: string[];
  includedStorageMB?: number;
  includedStorageBytes?: number;
  storageUnit?: 'MB' | 'GB';
  storageDisplay?: string;
};

export type BillingSettings = {
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
};

export type ThemePalette = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  fontFamily: string;
  radius: string;
  backgroundColor?: string;
  textColor?: string;
};

export type ThemeSettings = {
  admin: ThemePalette;
  shop: ThemePalette;
  website: ThemePalette;
};

export type LeadRecord = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  message?: string;
  type: 'contact' | 'demo' | 'enterprise';
  status: 'pending' | 'contacted' | 'resolved';
  createdAt: string;
};

export type RevenueReport = {
  mrr: number;
  arr: number;
  paidShops: number;
  freeShops: number;
  totalShops: number;
  activeShops: number;
  planMix: Array<{ planCode: string; shops: number; monthlyRevenue: number }>;
  revenueByShop: Array<{
    id: string;
    shopName: string;
    status: string;
    subscriptionPlan: string;
    planName: string;
    monthlyRevenue: number;
    yearlyRevenue: number;
    createdAt?: string | Date;
  }>;
  monthlyActivity: Record<string, number>;
};

export type UsageReport = {
  collectionFootprint: Record<string, number>;
  monthlyActivity: Record<string, number>;
  planDistribution: Array<{ planCode: string; shops: number; monthlyRevenue: number }>;
  totalShops: number;
  activeShops: number;
  suspendedShops: number;
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalInvoices: number;
};
export type CustomPlanRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'QUOTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'REGISTRATION_PENDING'
  | 'SHOP_REGISTERED'
  | 'CANCELLED';

export type PlatformGstStatus =
  | 'not_configured'
  | 'pending'
  | 'verified'
  | 'failed'
  | 'suspended';

export type GstVerificationStatus = 'SELF_DECLARED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
export type GstVerificationMode = 'LOCAL_CHECKSUM' | 'SELF_DECLARATION' | 'MANUAL_ADMIN' | 'SANDBOX_API' | 'LIVE_API';
export type GstProviderType = 'LOCAL_CHECKSUM' | 'SANDBOX' | 'SUREPASS' | 'ZOOP' | 'DECENTRO' | 'MASTERS_INDIA';

export type ShopGstProfile = {
  shopId: string;
  shopName: string;
  isGstRegistered: boolean;
  gstin: string;
  legalName: string;
  tradeName?: string;
  businessType?: string;
  compositionScheme?: boolean;
  verificationStatus: GstVerificationStatus;
  verificationMode: GstVerificationMode;
  verificationProvider: GstProviderType;
  verifiedAt?: any | null;
  verifiedBy?: string | null;
  certificateUrl?: string | null;
  certificateUploadedAt?: any | null;
  rejectionReason?: string | null;
  selfDeclarationAccepted: boolean;
  selfDeclarationAcceptedAt?: any | null;
};

export type PlatformGstSettings = {
  gstNumber: string;
  legalBusinessName: string;
  panNumber: string;
  businessType: string;
  gstStatus: PlatformGstStatus;
  gstVerified: boolean;
  gstCollectionEnabled: boolean;
  verificationStatus?: GstVerificationStatus;
  verificationMode?: GstVerificationMode;
  verificationProvider?: GstProviderType;
  selfDeclarationAccepted?: boolean;
  selfDeclarationAcceptedAt?: any | null;
  certificateUrl?: string | null;
  certificateUploadedAt?: any | null;
  rejectionReason?: string | null;
  verifiedAt: any | null;
  verifiedBy: string | null;
  lastVerificationAttempt: any | null;
  verificationError: string | null;
  businessAddress: string;
  state: string;
  stateCode: string;
  city: string;
  pincode: string;
  country: string;
  email: string;
  phone: string;
  cin?: string | null;
  msmeNumber?: string | null;
  iec?: string | null;
  gstRate: number;
  updatedAt: any;
  updatedBy: string;
};

export type CustomPlanRequest = {
  id: string;
  contactName: string;
  shopName: string;
  email: string;
  phone: string;
  selectedFeatures: string[];
  estimatedMonthlyPrice?: number;
  finalPrice?: number;
  billingCycle?: 'monthly' | 'yearly';
  adminNote?: string;
  quoteGeneratedAt?: any;
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  paymentId?: string;
  paymentCompletedAt?: any;
  shopId?: string;
  registrationToken?: string;
  registrationLink?: string;
  status: CustomPlanRequestStatus;
  activityLog?: Array<{
    status: CustomPlanRequestStatus;
    note?: string;
    performedBy?: string;
    timestamp: any;
  }>;
  createdAt: any;
  updatedAt: any;
};


@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly requestTtlMs = 300_000;
  private readonly requestCache = new Map<string, Observable<any>>();

  private cacheRequest<T>(key: string, factory: () => Observable<T>): Observable<T> {
    const cached = this.requestCache.get(key);
    if (cached) {
      return cached as Observable<T>;
    }

    const request$ = factory().pipe(
      shareReplay({ bufferSize: 1, refCount: false, windowTime: this.requestTtlMs }),
    );
    this.requestCache.set(key, request$);
    return request$;
  }

  private invalidateKeys(...prefixes: string[]) {
    for (const key of this.requestCache.keys()) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        this.requestCache.delete(key);
      }
    }
  }

  getOverview(): Observable<ApiResponse<AdminOverview>> {
    return this.cacheRequest('overview', () => this.http.get<ApiResponse<AdminOverview>>(`${this.apiUrl}/overview`));
  }

  getShops(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.http.get<ApiResponse<AdminShop[]>>(`${this.apiUrl}/shops${suffix}`);
  }

  getShopRequests(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/shops/requests`);
  }

  processShopRequest(requestId: string, action: 'approve' | 'reject'): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/shops/requests/${requestId}/action`, { action });
  }

  updateShop(id: string, payload: Partial<AdminShop>) {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/shops/${id}`, payload);
  }

  getShop(id: string) {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/shops/${id}`);
  }

  getShopDetails(id: string) {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/shops/${id}/details`);
  }

  getShopSecurityStatus(id: string) {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/shops/${id}/security-status`);
  }

  reactivateShop(id: string) {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/shops/${id}/reactivate`, {});
  }


  getUsers(search = '') {
    const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<ApiResponse<AdminUser[]>>(`${this.apiUrl}/users${suffix}`);
  }

  getAdmins(search = '') {
    const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<ApiResponse<AdminUser[]>>(`${this.apiUrl}/users/admins${suffix}`);
  }

  getStaff(search = '') {
    const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/users/staffs${suffix}`);
  }

  getPlatformCustomers(search = '') {
    const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/users/customers${suffix}`);
  }

  getActivityLogs(search = '') {
    const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/activity-logs${suffix}`);
  }

  getFeatures(activeOnly = false) {
    return this.cacheRequest(`features:${activeOnly}`, () =>
      this.http.get<ApiResponse<FeatureRecord[]>>(`${this.apiUrl}/features?activeOnly=${activeOnly}`),
    );
  }

  createFeature(payload: Partial<FeatureRecord>) {
    this.invalidateKeys('features:');
    return this.http.post<ApiResponse<FeatureRecord>>(`${this.apiUrl}/features`, payload);
  }

  updateFeature(key: string, payload: Partial<FeatureRecord>) {
    this.invalidateKeys('features:');
    return this.http.put<ApiResponse<FeatureRecord>>(`${this.apiUrl}/features/${key}`, payload);
  }

  deleteFeature(key: string) {
    this.invalidateKeys('features:');
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/features/${key}`);
  }

  getRoles() {
    return this.cacheRequest('roles', () => this.http.get<ApiResponse<RoleRecord[]>>(`${this.apiUrl}/roles`));
  }

  createRole(payload: Partial<RoleRecord>) {
    this.invalidateKeys('roles');
    return this.http.post<ApiResponse<RoleRecord>>(`${this.apiUrl}/roles`, payload);
  }

  updateRole(id: string, payload: Partial<RoleRecord>) {
    this.invalidateKeys('roles');
    return this.http.put<ApiResponse<RoleRecord>>(`${this.apiUrl}/roles/${id}`, payload);
  }

  deleteRole(id: string) {
    this.invalidateKeys('roles');
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/roles/${id}`);
  }

  assignRoleToUser(userId: string, roleId: string, shopId?: string) {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/roles/assign/${userId}`, {
      roleId,
      shopId,
    });
  }

  getPlans() {
    return this.cacheRequest('plans', () => this.http.get<ApiResponse<SubscriptionPlanRecord[]>>(`${this.apiUrl}/plans`));
  }

  createPlan(payload: Partial<SubscriptionPlanRecord>) {
    this.invalidateKeys('plans', 'shops');
    return this.http.post<ApiResponse<SubscriptionPlanRecord>>(`${this.apiUrl}/plans`, payload);
  }

  updatePlan(id: string, payload: Partial<SubscriptionPlanRecord>) {
    this.invalidateKeys('plans', 'shops');
    return this.http.put<ApiResponse<SubscriptionPlanRecord>>(`${this.apiUrl}/plans/${id}`, payload);
  }

  deletePlan(id: string) {
    this.invalidateKeys('plans', 'shops');
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/plans/${id}`);
  }

  assignPlanToUser(userId: string, planId: string, syncShopPlan = true) {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/subscriptions/users/${userId}/plan`, {
      planId,
      syncShopPlan,
    });
  }

  getShopAddons(shopId: string) {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/shops/${shopId}/addons`);
  }

  getAddonCatalog(shopId: string) {
    return this.http.get<ApiResponse<{ features: any[], limits: any[] }>>(`${this.apiUrl}/shops/${shopId}/addons/catalog`);
  }

  createShopAddon(shopId: string, payload: { itemKey: string; itemType: string; price?: number; quantity?: number; notes?: string }) {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/shops/${shopId}/addons`, payload);
  }

  cancelShopAddon(shopId: string, itemId: string) {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/shops/${shopId}/addons/${itemId}/cancel`, {});
  }

  getUpcomingInvoice(shopId: string) {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/shops/${shopId}/addons/upcoming-invoice`);
  }

  recalculateShopStorage(shopId: string) {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/shops/${shopId}/storage/recalculate`, {});
  }

  cancelShopStorageAddon(shopId: string) {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/shops/${shopId}/storage/addon`);
  }

  /** Admin-level: Cancel a shop's AutoPay subscription (at cycle end by default) */
  cancelAutoPaySubscription(shopId: string, cancelAtCycleEnd = true) {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/payment/cancel-subscription`, {
      shopId,
      cancelAtCycleEnd,
    });
  }

  getBillingSettings() {
    return this.cacheRequest('billing', () =>
      this.http.get<ApiResponse<BillingSettings>>(`${this.apiUrl}/platform/billing`),
    );
  }

  updateBillingSettings(payload: Partial<BillingSettings>) {
    this.invalidateKeys('billing');
    return this.http.put<ApiResponse<BillingSettings>>(`${this.apiUrl}/platform/billing`, payload);
  }

  getThemeSettings() {
    return this.cacheRequest('themes', () =>
      this.http.get<ApiResponse<ThemeSettings>>(`${this.apiUrl}/platform/themes`),
    );
  }

  getPublicThemeSettings() {
    return this.http.get<ApiResponse<ThemeSettings>>(`${environment.publicApiUrl}/themes`);
  }

  updateThemeSettings(payload: Partial<ThemeSettings>) {
    this.invalidateKeys('themes');
    return this.http.put<ApiResponse<ThemeSettings>>(`${this.apiUrl}/platform/themes`, payload);
  }

  getPlatformCostsPricing() {
    return this.cacheRequest('platform_costs_pricing', () =>
      this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/cost-analytics/pricing`),
    );
  }

  updatePlatformCostsPricing(payload: any) {
    this.invalidateKeys('platform_costs_pricing');
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/cost-analytics/pricing`, payload);
  }

  getPlatformCostsPricingHistory() {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/cost-analytics/pricing/history`);
  }

  getPlatformCostsReport(startDate?: string, endDate?: string, type?: string) {
    let url = `${this.apiUrl}/cost-analytics/report`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (type) params.push(`type=${type}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<ApiResponse<any>>(url);
  }

  refreshPlatformCostsReport() {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/cost-analytics/report/refresh`, {});
  }

  exportPlatformCostsReport(startDate?: string, endDate?: string) {
    let url = `${this.apiUrl}/cost-analytics/report/export`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get(url, { responseType: 'text' });
  }

  getTransactions(limit = 50) {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/transactions?limit=${limit}`);
  }

  getLeads(type?: string, status?: string): Observable<ApiResponse<LeadRecord[]>> {
    const query = new URLSearchParams();
    if (type) query.set('type', type);
    if (status) query.set('status', status);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.http.get<ApiResponse<LeadRecord[]>>(`${this.apiUrl}/leads${suffix}`);
  }

  updateLeadStatus(id: string, status: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/leads/${id}`, { status });
  }

  deleteLead(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/leads/${id}`);
  }

  getSupportTickets(status?: string): Observable<ApiResponse<SupportTicket[]>> {
    const suffix = status ? `?status=${status}` : '';
    return this.http.get<ApiResponse<SupportTicket[]>>(`${this.apiUrl}/support${suffix}`);
  }

  replyToTicket(ticketId: string, adminReply: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/support/${ticketId}/reply`, { adminReply });
  }

  closeTicket(ticketId: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/support/${ticketId}/close`, {});
  }

  getRevenueReport(): Observable<ApiResponse<RevenueReport>> {
    return this.cacheRequest('reports:revenue', () =>
      this.http.get<ApiResponse<RevenueReport>>(`${this.apiUrl}/reports/revenue`),
    );
  }

  getUsageReport(): Observable<ApiResponse<UsageReport>> {
    return this.cacheRequest('reports:usage', () =>
      this.http.get<ApiResponse<UsageReport>>(`${this.apiUrl}/reports/usage`),
    );
  }

  // ── Custom Plan Requests ──────────────────────────────────────────────────

  getCustomPlanRequests(filters?: { status?: string; search?: string; limit?: number }): Observable<ApiResponse<CustomPlanRequest[]>> {
    const query = new URLSearchParams();
    if (filters?.status) query.set('status', filters.status);
    if (filters?.search) query.set('search', filters.search);
    if (filters?.limit) query.set('limit', String(filters.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.http.get<ApiResponse<CustomPlanRequest[]>>(`${this.apiUrl}/plans/custom-requests${suffix}`);
  }

  getCustomPlanRequest(id: string): Observable<ApiResponse<CustomPlanRequest>> {
    return this.http.get<ApiResponse<CustomPlanRequest>>(`${this.apiUrl}/plans/custom-requests/${id}`);
  }

  updateCustomPlanRequestStatus(id: string, status: CustomPlanRequestStatus, note?: string): Observable<ApiResponse<CustomPlanRequest>> {
    return this.http.patch<ApiResponse<CustomPlanRequest>>(`${this.apiUrl}/plans/custom-requests/${id}/status`, { status, note });
  }

  generateCustomPlanQuote(id: string, finalPrice: number, billingCycle: 'monthly' | 'yearly', adminNote?: string): Observable<ApiResponse<CustomPlanRequest>> {
    return this.http.post<ApiResponse<CustomPlanRequest>>(`${this.apiUrl}/plans/custom-requests/${id}/quote`, { finalPrice, billingCycle, adminNote });
  }

  cancelCustomPlanRequest(id: string, reason?: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/plans/custom-requests/${id}`, { body: { reason } });
  }

  generateCustomPlanPaymentLink(id: string): Observable<ApiResponse<CustomPlanRequest>> {
    return this.http.post<ApiResponse<CustomPlanRequest>>(`${this.apiUrl}/plans/custom-requests/${id}/payment-link`, {});
  }

  syncCustomPlanPaymentStatus(id: string): Observable<ApiResponse<CustomPlanRequest>> {
    return this.http.post<ApiResponse<CustomPlanRequest>>(`${this.apiUrl}/plans/custom-requests/${id}/sync-payment`, {});
  }

  // ── Platform Telemetry Settings ───────────────────────────────────────────────────

  getPlatformTelemetrySettings(): Observable<ApiResponse<any>> {
    return this.cacheRequest('platform:telemetry', () =>
      this.http.get<ApiResponse<any>>(`${this.apiUrl}/platform/telemetry`),
    );
  }

  updatePlatformTelemetrySettings(payload: any): Observable<ApiResponse<any>> {
    this.invalidateKeys('platform:telemetry');
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/platform/telemetry`, payload);
  }

  // ── Admin Shop GST Verification Management ─────────────────────────────────────

  getShopGstProfiles(status?: string): Observable<ApiResponse<ShopGstProfile[]>> {
    const url = status ? `${this.apiUrl}/admin/gst/shops?status=${status}` : `${this.apiUrl}/admin/gst/shops`;
    return this.http.get<ApiResponse<ShopGstProfile[]>>(url);
  }

  approveShopGst(shopId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/admin/gst/shops/${shopId}/approve`, {});
  }

  rejectShopGst(shopId: string, reason: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/admin/gst/shops/${shopId}/reject`, { reason });
  }

  // ── Platform General Settings ──────────────────────────────────────────────────────

  getPlatformGeneralSettings(): Observable<ApiResponse<any>> {
    return this.cacheRequest('platform:general', () =>
      this.http.get<ApiResponse<any>>(`${this.apiUrl}/platform/general`),
    );
  }

  updatePlatformGeneralSettings(payload: any): Observable<ApiResponse<any>> {
    this.invalidateKeys('platform:general');
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/platform/general`, payload);
  }

  // ── Platform GST Settings ─────────────────────────────────────────────────

  getPlatformGstSettings(): Observable<ApiResponse<PlatformGstSettings>> {
    return this.cacheRequest('platform:gst', () =>
      this.http.get<ApiResponse<PlatformGstSettings>>(`${this.apiUrl}/platform/gst`),
    );
  }

  savePlatformGstSettings(payload: Partial<PlatformGstSettings>): Observable<ApiResponse<PlatformGstSettings>> {
    this.invalidateKeys('platform:gst');
    return this.http.put<ApiResponse<PlatformGstSettings>>(`${this.apiUrl}/platform/gst`, payload);
  }

  verifyPlatformGst(): Observable<ApiResponse<PlatformGstSettings>> {
    this.invalidateKeys('platform:gst');
    return this.http.post<ApiResponse<PlatformGstSettings>>(`${this.apiUrl}/platform/gst/verify`, {});
  }

  togglePlatformGstCollection(enabled: boolean): Observable<ApiResponse<PlatformGstSettings>> {
    this.invalidateKeys('platform:gst');
    return this.http.patch<ApiResponse<PlatformGstSettings>>(`${this.apiUrl}/platform/gst/toggle`, { enabled });
  }

  // ── Platform Observability Dashboard ──────────────────────────────────────

  getObservabilityMetrics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/observability/metrics`);
  }

  getObservabilityHistory(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/observability/history`);
  }

  getPlatformCostSettings(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/platform/cost-protection`);
  }

  updatePlatformCostSettings(payload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/platform/cost-protection`, payload);
  }

  // ── Database Management ───────────────────────────────────────────────────

  getDbOverview(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/db-management/overview`);
  }

  getDbConfig(provider: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/db-management/config/${provider}`);
  }

  saveDbConfig(provider: string, payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/config/${provider}`, payload);
  }

  testDbConnection(provider: string, payload?: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/test-connection/${provider}`, payload || {});
  }

  switchDbProvider(provider: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/switch-provider`, { provider });
  }

  getDbHealth(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/db-management/health`);
  }

  getDbLogs(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/db-management/logs`);
  }

  getDbEnv(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/db-management/env`);
  }

  backupDb(provider: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/backup/${provider}`, {});
  }

  restoreDb(provider: string, payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/restore/${provider}`, payload);
  }

  flushDbCache(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/cache/flush`, {});
  }

  reconnectDbCache(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/cache/reconnect`, {});
  }

  resetDbConfig(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/advanced/reset`, {});
  }

  // ── Database Seeding & Data Cleaning Maintenance ──────────────────────────

  seedDb(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/maintenance/seed`, payload);
  }

  validateSeedConfig(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/maintenance/validate-seed`, payload);
  }

  previewSeed(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/maintenance/preview-seed`, payload);
  }

  getSeedReport(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/db-management/maintenance/seed-report`);
  }

  previewCleanup(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/maintenance/preview-cleanup`, payload);
  }

  cleanupDb(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/db-management/maintenance/cleanup`, payload);
  }

  getCleanupReport(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/db-management/maintenance/cleanup-report`);
  }

  // --- Observability & Health ---
  getPlatformHealth(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/observability/platform-health`);
  }

  // --- Announcements ---
  getAnnouncements(filters?: any): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/announcements`, { params: filters });
  }
  
  getAnnouncementById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/announcements/${id}`);
  }

  createAnnouncement(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/announcements`, data);
  }

  updateAnnouncement(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/announcements/${id}`, data);
  }

  deleteAnnouncement(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/announcements/${id}`);
  }

  // --- Data Exports ---
  requestExport(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/exports`, payload);
  }

  getExportHistory(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/exports/history`);
  }

  downloadExport(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exports/${id}/download`, { responseType: 'blob' });
  }

  cancelExport(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/exports/${id}/cancel`, {});
  }
}
