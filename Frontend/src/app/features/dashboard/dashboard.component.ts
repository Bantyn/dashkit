import { Component, inject, OnInit, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DashboardService, DashboardData } from './dashboard.service';
import { ShopService } from '../../core/services/shop.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { FeatureGuardService } from '../../core/services/feature-guard.service';
import { ToastService } from '../../core/services/toast.service';
import { Shop } from '../../core/models/shop.model';
import { PrintService } from '../../shared/components/print-preview-modal.component';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AnnouncementBannerComponent } from '../../shared/components/announcement-banner/announcement-banner.component';
import { BillingStatusBannerComponent } from '../../shared/components/billing-status-banner.component';
import { BranchService } from '../../core/services/branch.service';
import { BranchContextService } from '../../core/services/branch-context.service';
import { UiDropdownComponent } from '../../shared/components/ui-dropdown.component';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { LucideAngularModule } from 'lucide-angular';
import { AreaChartComponent } from '../../shared/components/ui/area-chart.component';
import { SparklineChartComponent } from '../../shared/components/ui/sparkline-chart.component';
import { DonutChartComponent } from '../../shared/components/ui/donut-chart.component';
import { Observable, combineLatest, of } from 'rxjs';
import { ChartData, ChartOptions } from 'chart.js';
import { HasFeatureDirective } from '../../core/directives/has-feature.directive';
import { UiCounterComponent } from '../../shared/components/ui-counter.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AnnouncementBannerComponent,
    BillingStatusBannerComponent,
    UiDropdownComponent,
    UiLoadingComponent,
    LucideAngularModule,
    AreaChartComponent,
    SparklineChartComponent,
    DonutChartComponent,
    HasFeatureDirective,
    UiCounterComponent,
  ],
  templateUrl: './dashboard.component.html',
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      @keyframes fadeInUpFader {
        0% { opacity: 0; transform: translateY(15px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .animate-dashboard-reveal {
        animation: fadeInUpFader 0.5s ease-out forwards;
        opacity: 0;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  dashboardData: DashboardData | null = null;
  loading = true;
  error: string | null = null;

  loader = inject(ActivatedRoute);
  selectedPeriod = 'this_month';
  selectedOrderPeriod = 'this_month';
  currentShopId: string | null = null;
  announcements$: Observable<any[]> | null = null;
  currentShop: Shop | null = null;
  payingCustom = false;
  activeBranchesCount = 0;

  liveTrialCountdown = '';
  private countdownInterval: any;

  // ─── Sparkline placeholder data (overwritten by real API data) ───
  revenueSparkline:  number[] = [0, 0, 0, 0, 0];
  invoiceSparkline:  number[] = [0, 0, 0, 0, 0];
  orderSparkline:    number[] = [0, 0, 0, 0, 0];
  customerSparkline: number[] = [0, 0, 0, 0, 0];
  productSparkline:  number[] = [0, 0, 0, 0, 0];

  // ─── Product avatar palettes ───
  private avatarPalettes = [
    { bg: '#ede9fe', color: '#7c3aed' },
    { bg: '#d1fae5', color: '#065f46' },
    { bg: '#dbeafe', color: '#1e40af' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#fce7f3', color: '#9d174d' },
    { bg: '#e0f2fe', color: '#0369a1' },
  ];

  getProductAvatarBg(index: number): { bg: string; color: string } {
    return this.avatarPalettes[index % this.avatarPalettes.length];
  }

  // ─── Time-based greeting ───
  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  get greetingEmoji(): string {
    const h = new Date().getHours();
    if (h < 12) return 'bi bi-hand-index-thumb-fill';
    if (h < 17) return 'bi bi-sun-fill';
    return 'bi bi-moon-stars-fill';
  }

  get ownerName(): string {
    return this.currentShop?.ownerName || this.authService.getCurrentUser()?.displayName || 'Owner';
  }

  get shopName(): string {
    return this.currentShop?.shopName || this.currentShop?.displayName || 'your shop';
  }

  get isTrialActive(): boolean {
    if (!this.currentShop?.trialExpiresAt) return false;
    const expiry = this.parseDate(this.currentShop.trialExpiresAt);
    const isTrial = this.currentShop.subscriptionStatus === 'trial' || this.currentShop.subscriptionPlan === 'trial' || this.currentShop.paymentStatus === 'trial';
    return isTrial && expiry.getTime() > Date.now();
  }

  get isTrialExpired(): boolean {
    if (!this.currentShop?.trialExpiresAt) return false;
    const expiry = this.parseDate(this.currentShop.trialExpiresAt);
    const isTrial = this.currentShop.subscriptionStatus === 'trial' || this.currentShop.subscriptionPlan === 'trial' || this.currentShop.paymentStatus === 'trial';
    return isTrial && expiry.getTime() <= Date.now();
  }

  get trialDaysRemaining(): number {
    if (!this.currentShop?.trialExpiresAt) return 0;
    const expiry = this.parseDate(this.currentShop.trialExpiresAt);
    const diffTime = expiry.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  get trialDayCurrent(): number {
    return Math.max(1, 5 - this.trialDaysRemaining);
  }

  get trialProgressPercent(): number {
    if (!this.currentShop?.trialExpiresAt) return 0;
    const expiry = this.parseDate(this.currentShop.trialExpiresAt);
    const diffTime = expiry.getTime() - Date.now();
    const totalMs = 5 * 24 * 60 * 60 * 1000;
    const remainingPercent = (diffTime / totalMs) * 100;
    return Math.max(0, Math.min(100, 100 - remainingPercent));
  }

  get planName(): string {
    const rawPlan = this.currentShop?.subscriptionPlan || '';
    if (!rawPlan) return 'Trial';
    return rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1);
  }

  getProgressBar(): string {
    const filled = Math.max(0, Math.min(5, this.trialDayCurrent));
    const empty = 5 - filled;
    return '██'.repeat(filled) + '░░'.repeat(empty);
  }

  private parseDate(val: any): Date {
    if (val instanceof Date) return val;
    if (val && typeof val === 'object' && 'seconds' in val) {
      return new Date(val.seconds * 1000);
    }
    if (val && typeof val === 'object' && '_seconds' in val) {
      return new Date((val as any)._seconds * 1000);
    }
    return new Date(val);
  }

  showChangePlan = false;
  isUpdatingPlan = false;
  selectedNewPlan = '';
  availablePlans: any[] = [];

  openChangePlanPanel() {
    this.showChangePlan = true;
    this.fetchPlans();
  }

  proceedToPayment() {
    // If backend payment integration (e.g. Stripe/Razorpay) exists, redirect to checkout here.
    // For now, we fallback to opening the subscription panel where they can confirm.
    if (this.currentShop?.subscriptionPlan && this.currentShop.subscriptionPlan !== 'free') {
      this.toastService.showInfo(`Proceeding to payment for ${this.currentShop.subscriptionPlan.toUpperCase()} plan...`);
    }
    this.openChangePlanPanel();
  }

  closeChangePlanPanel() {
    this.showChangePlan = false;
  }

  fetchPlans() {
    this.http.get<any>(`${environment.apiUrl}/plans`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.availablePlans = (res.data || [])
            .filter((p: any) => p.id !== 'free' && p.id !== 'trial')
            .sort((a: any, b: any) => a.sortOrder - b.sortOrder);
        }
      },
      error: (err) => {
        console.error('Error fetching plans:', err);
      }
    });
  }

  changePlan(newPlanCode: string) {
    if (!this.currentShopId || this.isUpdatingPlan) return;
    this.isUpdatingPlan = true;
    this.selectedNewPlan = newPlanCode;

    this.shopService.updateShop(this.currentShopId, { subscriptionPlan: newPlanCode }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess(`Plan switched to ${newPlanCode.toUpperCase()} successfully.`);
          this.loadShopPlan(this.currentShopId!);
          this.authService.refreshProfile().then(() => {
            this.isUpdatingPlan = false;
            this.closeChangePlanPanel();
            this.cdr.detectChanges();
          });
        } else {
          this.toastService.showError('Failed to update subscription plan.');
          this.isUpdatingPlan = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error switching plan:', err);
        this.toastService.showError(err.error?.message || 'Error updating subscription plan.');
        this.isUpdatingPlan = false;
        this.cdr.detectChanges();
      }
    });
  }

  periodOptions = [
    { value: 'this_month', label: 'This Month', icon: 'layers', color: '#10B981' },
    { value: 'last_month', label: 'Last Month', icon: 'layers', color: '#6366F1' },
    { value: 'this_year',  label: 'This Year',  icon: 'layers', color: '#F59E0B' },
  ];

  private shopService   = inject(ShopService);
  private featureService = inject(FeatureGuardService);
  private destroyRef    = inject(DestroyRef);
  private toastService  = inject(ToastService);
  private http          = inject(HttpClient);
  private authService   = inject(AuthService);
  private branchService = inject(BranchService);
  private branchContext = inject(BranchContextService);
  private printService  = inject(PrintService);
  private invoiceService = inject(InvoiceService);

  get filteredQuickLinks() {
    return this.quickLinks.filter((link) =>
      this.featureService.hasFeatureSync(this.currentShop, link.feature)
    );
  }

  hasFeature(feature: string): boolean {
    return this.featureService.hasFeatureSync(this.currentShop, feature);
  }

  quickLinks = [
    { label: 'New Invoice', icon: 'bi-plus-circle-fill', route: 'invoices',   color: 'blue',   action: 'new_invoice', feature: 'sell_invoices' },
    { label: 'POS Billing', icon: 'bi-calculator',       route: 'pos',         color: 'green',  feature: 'sell_pos_billing' },
    { label: 'Orders',      icon: 'bi-cart-check-fill',  route: 'orders',      color: 'purple', feature: 'sell_pos_billing' },
    { label: 'Products',    icon: 'bi-bag-fill',          route: 'products',    color: 'orange', feature: 'inv_product_listing' },
    { label: 'Inventory',   icon: 'bi-box-seam-fill',    route: 'inventory',   color: 'red',    feature: 'inv_stock_tracking' },
    { label: 'Customers',   icon: 'bi-people-fill',      route: 'customers',   color: 'teal',   feature: 'cust_list' },
  ];

  constructor(
    private dashboardService: DashboardService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.announcements$ = this.dashboardService.getAnnouncements();
  }

  ngOnInit() {
    this.countdownInterval = setInterval(() => this.updateLiveCountdown(), 1000);
    this.destroyRef.onDestroy(() => clearInterval(this.countdownInterval));

    const parentParams$ = this.route.parent ? this.route.parent.paramMap : of(null);

    combineLatest([
      parentParams$,
      this.branchContext.activeBranch$
    ]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([params, branch]) => {
      const shopId = params ? (params as ParamMap).get('shopId') : null;
      if (shopId) {
        this.currentShopId = shopId;
        this.loadShopPlan(shopId);
        this.loadDashboardData(shopId);
      }
    });
  }

  loadBranchesCount(shopId: string) {
    this.branchService.getBranches(shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.activeBranchesCount = res.data?.filter(b => b.status === 'Active')?.length || 0;
        this.cdr.detectChanges();
      }
    });
  }

  loadShopPlan(shopId: string) {
    this.shopService.getShop(shopId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
      if (res.data) {
        this.currentShop = res.data;
        this.payingCustom = (res.data.subscriptionPlan === 'custom');
        this.updateLiveCountdown();
        
        if (this.hasFeature('ent_multi_branch')) {
          this.loadBranchesCount(shopId);
        }
      }
    });
  }

  loadDashboardData(shopId: string) {
    this.loading = true;
    this.dashboardService
      .getDashboardData(shopId, this.selectedPeriod, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          console.log('FRONTEND DASHBOARD DATA RECEIVED:', data);
          this.dashboardData = data;
          
          if (data.sparklines) {
            this.revenueSparkline = data.sparklines.revenue;
            this.invoiceSparkline = data.sparklines.invoices;
            this.orderSparkline = data.sparklines.orders;
            this.customerSparkline = data.sparklines.customers;
            this.productSparkline = data.sparklines.products;
          } else if (data.salesChartData?.length) {
            this.revenueSparkline = data.salesChartData.map((d) => d.value);
            this.invoiceSparkline = [0, 0, 0, 0, 0];
            this.orderSparkline = [0, 0, 0, 0, 0];
            this.customerSparkline = [0, 0, 0, 0, 0];
            this.productSparkline = [0, 0, 0, 0, 0];
          } else {
            this.revenueSparkline = [0, 0, 0, 0, 0];
            this.invoiceSparkline = [0, 0, 0, 0, 0];
            this.orderSparkline = [0, 0, 0, 0, 0];
            this.customerSparkline = [0, 0, 0, 0, 0];
            this.productSparkline = [0, 0, 0, 0, 0];
          }

          if (data.salesChartData?.length) {
            this.updateChartData(data.salesChartData);
          } else {
            this.salesChartData.labels = [];
            this.salesChartData.datasets[0].data = [];
          }
          
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Dashboard error:', err);
          if (err.status === 403) {
            this.dashboardData = this.getEmptyDashboardData();
            this.error = null;
          } else {
            this.error = 'Failed to load dashboard data.';
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  getEmptyDashboardData(): DashboardData {
    return {
      stats: {
        totalRevenue: 0, revenueTrend: 0, totalInvoices: 0, invoiceTrend: 0, totalCustomers: 0, totalOnlineCustomers: 0,
        customerTrend: 0, totalProducts: 0, productTrend: 0, totalOrders: 0, orderTrend: 0, totalExpenses: 0, expensesTrend: 0, pendingInvoices: 0, lowStockProducts: 0
      },
      topProducts: [],
      recentInvoices: [],
      salesChartData: [],
      sparklines: { revenue: [0,0,0,0,0], invoices: [0,0,0,0,0], orders: [0,0,0,0,0], customers: [0,0,0,0,0], products: [0,0,0,0,0] }
    };
  }

  onPeriodChange() {
    if (this.currentShopId) this.loadDashboardData(this.currentShopId);
  }

  navigateTo(route: string, action?: string) {
    if (!this.currentShopId) return;
    if (action === 'new_invoice') {
      this.router.navigate(['/', this.currentShopId, 'invoices'], { queryParams: { action: 'create' } });
    } else {
      this.router.navigate(['/', this.currentShopId, ...route.split('/')]);
    }
  }

  navigateToNewInvoice() {
    if (this.currentShopId) {
      this.router.navigate(['/', this.currentShopId, 'pos']);
    }
  }

  printInvoice(invoice: any) {
    if (!invoice?.id) return;
    this.toastService.showInfo('Loading print preview...');
    this.invoiceService.getInvoice(invoice.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.printService.openPreview(res.data);
        } else {
          this.toastService.showError('Failed to load invoice details.');
        }
      },
      error: (err) => {
        console.error('Error fetching invoice for print:', err);
        this.toastService.showError('Error loading invoice.');
      }
    });
  }

  sendWhatsApp(invoice: any) {
    const phone = invoice.customerPhone?.replace(/\D/g, '');
    if (!phone) {
      this.toastService.showWarning('No phone number available for this customer.');
      return;
    }
    const message = encodeURIComponent(
      `Hello ${invoice.customer},\n\nYour invoice *${invoice.invoiceNumber}* of ₹${invoice.amount} has been generated.\nDate: ${invoice.date}\nStatus: ${invoice.status}\n\nThank you for shopping with us! 🛍️`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  }

  async payCustomPlan() {
    if (!this.currentShopId || !this.currentShop?.customPrice) return;
    this.payingCustom = true;
    
    try {
      const token = await this.authService.getIdToken();
      
      this.http.post<any>(`${environment.apiUrl}/payment/create-order`, {
        shopId: this.currentShopId,
        planCode: 'custom',
        billingCycle: 'monthly'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (orderRes) => {
          if (!orderRes.success) {
            this.toastService.showError('Failed to create payment order.');
            this.payingCustom = false;
            return;
          }
          
          const options = {
            key: orderRes.data.key_id,
            amount: orderRes.data.amount,
            currency: orderRes.data.currency,
            name: "Clothify",
            description: "Enterprise Subscription Payment",
            order_id: orderRes.data.order_id,
            handler: (response: any) => {
              this.verifyCustomPayment(response, this.currentShopId!, token);
            },
            prefill: {
              name: this.currentShop?.shopName,
              email: this.currentShop?.email
            },
            theme: {
              color: "#4f46e5"
            },
            modal: {
               ondismiss: () => {
                 this.toastService.showWarning('Payment cancelled.');
                 this.payingCustom = false;
               }
            }
          };
          
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        },
        error: (err) => {
          this.toastService.showError(err.error?.message || 'Failed to initialize payment gateway.');
          this.payingCustom = false;
        }
      });
    } catch (e) {
      this.toastService.showError('Failed to authenticate payment.');
      this.payingCustom = false;
    }
  }

  private verifyCustomPayment(response: any, shopId: string, token: any) {
    this.http.post<any>(`${environment.apiUrl}/payment/verify-payment`, {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
      shopId,
      planCode: 'custom',
      billingCycle: 'monthly'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess('Payment successful! Your enterprise features are unlocked.');
          this.loadShopPlan(shopId); // Refresh shop data to remove banner
          this.payingCustom = false;
        } else {
          this.toastService.showError('Payment verification failed.');
          this.payingCustom = false;
        }
      },
      error: (err) => {
         this.toastService.showError('Payment verification failed.');
         this.payingCustom = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold';
    switch (status?.toLowerCase()) {
      case 'paid':      return `${base} bg-emerald-50 text-emerald-700 border border-emerald-200/60`;
      case 'pending':   return `${base} bg-amber-50 text-amber-700 border border-amber-200/60`;
      case 'cancelled': return `${base} bg-rose-50 text-rose-700 border border-rose-200/60`;
      case 'partial':   return `${base} bg-blue-50 text-blue-700 border border-blue-200/60`;
      default:          return `${base} bg-slate-100 text-slate-500`;
    }
  }

  updateLiveCountdown() {
    if (!this.currentShop?.trialExpiresAt || !this.isTrialActive) {
      this.liveTrialCountdown = '';
      return;
    }
    const expiry = this.parseDate(this.currentShop.trialExpiresAt);
    let diff = expiry.getTime() - Date.now();
    if (diff <= 0) {
      this.liveTrialCountdown = 'Expired';
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;
    const mins = Math.floor(diff / (1000 * 60));
    diff -= mins * 1000 * 60;
    const secs = Math.floor(diff / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    
    this.liveTrialCountdown = parts.join(' ');
  }

  getTrendClass(trend: number): string {
    return trend >= 0
      ? 'flex items-center gap-0.5 text-[11px] font-bold text-emerald-600'
      : 'flex items-center gap-0.5 text-[11px] font-bold text-rose-500';
  }

  getTrendIcon(trend: number): string {
    return trend >= 0 ? '↑' : '↓';
  }

  getTrendColor(trend: number): string {
    return trend >= 0 ? '#22C55E' : '#EF4444';
  }

  getQuickLinkBg(color: string): string {
    const map: Record<string, string> = {
      blue:   'bg-blue-50/80 text-blue-600 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30',
      green:  'bg-emerald-50/80 text-emerald-600 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/30',
      purple: 'bg-purple-50/80 text-purple-600 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-fuchsia-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-purple-500/30',
      orange: 'bg-orange-50/80 text-orange-600 group-hover:bg-gradient-to-br group-hover:from-orange-400 group-hover:to-red-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-orange-500/30',
      red:    'bg-rose-50/80 text-rose-600 group-hover:bg-gradient-to-br group-hover:from-rose-500 group-hover:to-pink-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-rose-500/30',
      teal:   'bg-cyan-50/80 text-cyan-600 group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-cyan-500/30',
    };
    return map[color] || 'bg-gray-50 text-gray-600';
  }

  // ─── Chart.js sales chart ───
  public salesChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Daily Revenue',
      fill: true,
      tension: 0.5,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.08)',
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#6366f1',
    }],
  };

  public salesChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,15,20,0.92)',
        titleColor: '#fff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (v: string | number) => '₹' + v,
          font: { size: 10 },
          color: '#94a3b8',
        },
      },
    },
  };

  updateChartData(data: { date: string; value: number }[]) {
    this.salesChartData.labels = data.map((d) => {
      const dt = new Date(d.date);
      return `${dt.getDate()}/${dt.getMonth() + 1}`;
    });
    this.salesChartData.datasets[0].data = data.map((d) => d.value);
  }
}
