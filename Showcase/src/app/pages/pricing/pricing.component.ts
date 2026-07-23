import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlanService, SubscriptionPlan } from '../../services/plan.service';
import { UiCounterComponent } from '../../components/ui-counter.component';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, UiCounterComponent, ScrollRevealDirective],
  templateUrl: './pricing.component.html'
})
export class PricingComponent implements OnInit {
  private planService = inject(PlanService);
  
  startBusinessPlans = signal<SubscriptionPlan[]>([]);
  growBusinessPlans = signal<SubscriptionPlan[]>([]);
  enterpriseBusinessPlans = signal<SubscriptionPlan[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Toggle for Monthly vs Yearly billing
  isYearly = signal<boolean>(false);

  // GST configuration
  isGstRegistered = signal<boolean>(true);
  gstRate = signal<number>(18);

  // Custom Plan Modal State
  isCustomPlanModalOpen = signal<boolean>(false);
  customPlanForm = {
    contactName: '',
    shopName: '',
    email: '',
    phone: ''
  };
  selectedCustomFeatures = signal<Set<string>>(new Set());
  isSubmittingCustomPlan = signal<boolean>(false);
  customPlanSuccessMessage = signal<string>('');
  customPlanErrorMessage = signal<string>('');


  estimatedCustomPrice = computed(() => {
    const selected = this.selectedCustomFeatures();
    let total = 0;
    for (const group of this.aLaCarteCategories) {
      for (const feature of group.features) {
        if (selected.has((feature as any).key)) {
          total += feature.price;
        }
      }
    }
    return total;
  });

  // Selected plan for bottom sheet modal
  selectedModalPlan = signal<SubscriptionPlan | null>(null);

  // A-la-carte Feature Pricing Data
  aLaCarteCategories = [
    {
      name: 'Inventory Management',
      description: 'Prevent stockouts and track products perfectly across all your locations.',
      icon: 'bi-box-seam',
      colorClass: 'text-blue-500 bg-blue-50',
      features: [
        { key: 'inv_product_listing', name: 'Product Listing', price: 49, description: 'Manage and display products digitally to keep your catalog organized.' },
        { key: 'inv_categories', name: 'Categories', price: 19, description: 'Group products for easier navigation and faster billing.' },
        { key: 'inv_brands', name: 'Brands Management', price: 19, description: 'Track inventory and sales performance by brand.' },
        { key: 'inv_variants', name: 'Product Variants', price: 29, description: 'Handle different sizes, colors, and materials efficiently.' },
        { key: 'inv_barcode', name: 'Barcode Support', price: 39, description: 'Speed up billing and inventory tracking with barcode scanning.' },
        { key: 'inv_stock_tracking', name: 'Stock Tracking', price: 79, description: 'Real-time visibility into your inventory to prevent stockouts.' },
        { key: 'inv_low_stock_alerts', name: 'Low Stock Alerts', price: 29, description: 'Never run out of best-sellers with automated low-stock warnings.' },
        { key: 'inv_purchase_orders', name: 'Purchase Orders', price: 49, description: 'Streamline restocking by creating professional POs for suppliers.' },
        { key: 'inv_suppliers', name: 'Suppliers', price: 29, description: 'Manage vendor details and track purchase histories in one place.' },
        { key: 'inv_bulk_import', name: 'Bulk Product Import', price: 49, description: 'Save hours of manual data entry by uploading via Excel/CSV.' },
        { key: 'inv_reports', name: 'Inventory Reports', price: 59, description: 'Make data-driven purchasing decisions with detailed stock insights.' },
        { key: 'inv_opening_stock', name: 'Opening Stock', price: 19, description: 'Easily transition your physical stock data into the digital system.' },
        { key: 'inv_color_inventory', name: 'Color-wise Inventory', price: 39, description: 'Track stock levels at a granular level based on colors.' },
        { key: 'seasonal_collections', name: 'Seasonal Collections', price: 39, description: 'Organize and promote seasonal stock for higher conversions.' },
        { key: 'inv_stock_transfer', name: 'Stock Transfer', price: 79, description: 'Move inventory seamlessly between your multiple branches.' }
      ]
    },
    {
      name: 'Selling & Billing',
      description: 'Speed up your checkout process, handle GST invoices, and manage payments seamlessly.',
      icon: 'bi-receipt',
      colorClass: 'text-green-500 bg-green-50',
      features: [
        { key: 'sell_pos_billing', name: 'POS Billing', price: 79, description: 'Fast and reliable point-of-sale system for quick checkout.' },
        { key: 'sell_invoices', name: 'Invoices', price: 39, description: 'Generate professional, GST-compliant invoices for your customers.' },
        { key: 'sell_credit_notes', name: 'Credit Notes', price: 29, description: 'Handle customer credits effortlessly for future purchases.' },
        { key: 'sell_drafts', name: 'Draft Orders', price: 29, description: 'Save incomplete orders and resume them later without losing data.' },
        { key: 'sell_returns', name: 'Sales Returns', price: 39, description: 'Process returns quickly while automatically updating inventory.' },
        { key: 'sell_daily_closing', name: 'Daily Closing', price: 29, description: 'Tally your cash and register balances at the end of the day.' },
        { key: 'sell_offers_discounts', name: 'Offers & Discounts', price: 49, description: 'Boost sales by applying custom discounts and promo codes.' },
        { key: 'wholesale_system', name: 'Wholesale System', price: 149, description: 'Manage B2B sales with custom wholesale pricing tiers.' },
        { key: 'sell_checkout', name: 'Online Checkout', price: 99, description: 'Allow customers to buy directly from your digital storefront.' },
        { key: 'sell_online_payments', name: 'Online Payments', price: 99, description: 'Accept UPI, Cards, and Netbanking securely to increase sales.' },
        { key: 'sell_cod', name: 'Cash on Delivery', price: 19, description: 'Enable COD orders to build trust and increase local sales.' }
      ]
    },
    {
      name: 'Website & Storefront',
      description: 'Take your business online and sell 24/7 with a beautifully branded e-commerce site.',
      icon: 'bi-globe',
      colorClass: 'text-purple-500 bg-purple-50',
      features: [
        { key: 'web_storefront', name: 'Storefront Website', price: 149, description: 'Launch your own branded e-commerce website instantly.' },
        { key: 'web_settings', name: 'Website Settings', price: 29, description: 'Control your website behavior, policies, and navigation.' },
        { key: 'web_theme', name: 'Theme Customization', price: 49, description: 'Personalize your store colors and fonts to match your brand.' },
        { key: 'web_pages', name: 'Custom Pages', price: 39, description: 'Create About Us, FAQ, and Policy pages to build credibility.' },
        { key: 'web_seo', name: 'SEO Tools', price: 49, description: 'Rank higher on Google and attract free organic traffic.' },
        { key: 'web_domain', name: 'Custom Domain', price: 29, description: 'Connect your own domain (yourbrand.com) for a professional look.' },
        { key: 'web_ai_bg_removal', name: 'Ai Auto Backround removal', price: 99, description: 'AI-powered automated image background removal tool.' }
      ]
    },
    {
      name: 'Customer Management',
      description: 'Build stronger relationships and easily manage Udhaar with complete customer profiles.',
      icon: 'bi-people',
      colorClass: 'text-pink-500 bg-pink-50',
      features: [
        { key: 'cust_list', name: 'Customer List', price: 29, description: 'Maintain a digital directory of all your customers.' },
        { key: 'cust_history', name: 'Purchase History', price: 29, description: 'Understand customer preferences by tracking what they buy.' },
        { key: 'cust_credits', name: 'Customer Credits', price: 39, description: 'Manage Udhaar by allowing trusted customers to buy on credit.' },
        { key: 'cust_reviews', name: 'Customer Reviews', price: 29, description: 'Collect and showcase product reviews to build social proof.' },
        { key: 'cust_online_customers', name: 'Online Customers', price: 49, description: 'Track and engage visitors who register on your website.' }
      ]
    },
    {
      name: 'Staff & HR',
      description: 'Manage employee permissions, track performance, and calculate sales commissions accurately.',
      icon: 'bi-person-badge',
      colorClass: 'text-orange-500 bg-orange-50',
      features: [
        { key: 'staff_management', name: 'Staff Management', price: 49, description: 'Keep records of your employees in one centralized system.' },
        { key: 'staff_add', name: 'Add Staff Module', price: 19, description: 'Easily onboard new staff members to your workspace.' },
        { key: 'staff_role_permissions', name: 'Role Permissions', price: 59, description: 'Protect sensitive business data by restricting staff access.' },
        { key: 'staff_commission', name: 'Staff Commission', price: 39, description: 'Incentivize sales by tracking and calculating staff commissions.' },
        { key: 'staff_logs', name: 'Staff Logs', price: 29, description: 'Monitor staff activity and logins for better security.' },
        { key: 'staff_performance', name: 'Staff Performance', price: 49, description: 'Identify your top-performing salespeople with detailed reports.' },
        { key: 'tailor_job_cards', name: 'Tailor Job Cards', price: 149, description: 'Manage custom tailoring orders and assign tasks to tailors.' }
      ]
    },
    {
      name: 'Finance',
      description: 'Keep a close eye on your revenue, expenses, and overall business health.',
      icon: 'bi-cash-coin',
      colorClass: 'text-emerald-500 bg-emerald-50',
      features: [
        { key: 'fin_transactions', name: 'Transactions', price: 29, description: 'Track every penny coming in and going out of your business.' },
        { key: 'fin_expenses', name: 'Expense Tracking', price: 39, description: 'Monitor your daily operating costs to improve profitability.' },
        { key: 'fin_payments', name: 'Payment Management', price: 49, description: 'Keep track of pending and completed vendor payments.' },
        { key: 'fin_tax_report', name: 'Tax Report', price: 59, description: 'Simplify your GST and tax filing with automated reports.' },
        { key: 'fin_pnl_report', name: 'P&L Report', price: 99, description: 'Get a clear picture of your business overall profit or loss.' }
      ]
    },
    {
      name: 'Accounting',
      description: 'Maintain professional ledgers, cash books, and bank records with zero accounting knowledge.',
      icon: 'bi-journal-text',
      colorClass: 'text-teal-500 bg-teal-50',
      features: [
        { key: 'acc_cash_book', name: 'Cash Book', price: 49, description: 'Digitally manage your daily cash flow and petty cash.' },
        { key: 'acc_bank_book', name: 'Bank Book', price: 49, description: 'Reconcile your bank accounts with your business transactions.' },
        { key: 'acc_receivables', name: 'Accounts Receivable', price: 79, description: 'Track money owed to you by customers to improve cash flow.' },
        { key: 'acc_payables', name: 'Accounts Payable', price: 79, description: 'Track money you owe to suppliers to manage working capital.' },
        { key: 'acc_ledger', name: 'General Ledger', price: 99, description: 'Maintain professional accounting records for your business.' }
      ]
    },
    {
      name: 'CRM',
      description: 'Drive repeat sales with targeted loyalty programs and personalized rewards.',
      icon: 'bi-heart',
      colorClass: 'text-red-500 bg-red-50',
      features: [
        { key: 'mktg_loyalty', name: 'Loyalty Program', price: 99, description: 'Retain customers by rewarding them for repeat purchases.' },
        { key: 'crm_birthday_wishes', name: 'Birthday Wishes', price: 39, description: 'Build relationships with automated personalized greetings.' },
        { key: 'crm_customer_segmentation', name: 'Customer Segmentation', price: 79, description: 'Group customers based on spending habits for targeted marketing.' },
        { key: 'crm_vip_leaderboard', name: 'VIP Leaderboard', price: 49, description: 'Identify and reward your most valuable customers.' }
      ]
    },
    {
      name: 'Analytics',
      description: 'Make data-driven decisions using powerful insights into your sales, products, and customers.',
      icon: 'bi-graph-up',
      colorClass: 'text-indigo-500 bg-indigo-50',
      features: [
        { key: 'analytics_dashboard', name: 'Analytics Dashboard', price: 49, description: 'A real-time overview of your business health in one screen.' },
        { key: 'analytics_sales', name: 'Sales Analytics', price: 79, description: 'Deep dive into your revenue trends and sales performance.' },
        { key: 'analytics_products', name: 'Product Analytics', price: 79, description: 'Discover which products are driving the most profit.' },
        { key: 'analytics_customers', name: 'Customer Analytics', price: 79, description: 'Understand customer acquisition and retention metrics.' },
        { key: 'analytics_branches', name: 'Branch Analytics', price: 99, description: 'Compare performance across all your retail locations.' }
      ]
    },
    {
      name: 'Marketing',
      description: 'Reach customers directly via WhatsApp and SMS to instantly boost your revenue.',
      icon: 'bi-megaphone',
      colorClass: 'text-yellow-500 bg-yellow-50',
      features: [
        { key: 'mktg_promotions', name: 'Promotions', price: 39, description: 'Run targeted marketing campaigns to clear dead stock.' },
        { key: 'mktg_festival_offers', name: 'Festival Offers', price: 29, description: 'Capitalize on festive seasons with special pricing logic.' },
        { key: 'mktg_sms', name: 'SMS Campaigns', price: 149, description: 'Reach customers directly on their phones with high open rates.' },
        { key: 'mktg_whatsapp', name: 'WhatsApp Campaigns', price: 199, description: 'Send rich media catalogs and offers via WhatsApp.' },
        { key: 'mktg_templates', name: 'Message Templates', price: 29, description: 'Save time with pre-written templates for common messages.' },
        { key: 'mktg_loyalty', name: 'Loyalty Programme', price: 99, description: 'Drive repeat sales through an engaging point system.' }
      ]
    },
    {
      name: 'Integrations',
      description: 'Connect your store with the external tools, APIs, and services you already use.',
      icon: 'bi-plug',
      colorClass: 'text-cyan-500 bg-cyan-50',
      features: [
        { key: 'intg_api_access', name: 'API Access', price: 299, description: 'Connect DashKit to your existing software and custom apps.' },
        { key: 'intg_invoice_template', name: 'Invoice Templates', price: 39, description: 'Choose from professional designs to match your brand identity.' }
      ]
    },
    {
      name: 'Shipping',
      description: 'Deliver products nationwide with integrated logistics and automated tracking.',
      icon: 'bi-truck',
      colorClass: 'text-amber-500 bg-amber-50',
      features: [
        { key: 'ship_setup', name: 'Shipping Setup', price: 39, description: 'Configure delivery zones and custom shipping rates.' },
        { key: 'ship_shiprocket', name: 'Shiprocket Integration', price: 99, description: 'Automate deliveries and tracking across India seamlessly.' }
      ]
    },
    {
      name: 'Enterprise',
      description: 'Scale your growing business with multi-branch control and strict security audit logs.',
      icon: 'bi-building',
      colorClass: 'text-slate-500 bg-slate-100',
      features: [
        { key: 'ent_multi_branch', name: 'Multi Branch (per Branch)', price: 500, description: 'Manage all your physical locations from a single central dashboard.' },
        { key: 'ent_audit_logs', name: 'Audit Logs', price: 149, description: 'Track every single action taken on your system for total security.' }
      ]
    }
  ];

  // Track hovered plan for visual effects
  hoveredPlanId = signal<string | null>(null);

  openFeatureModal(plan: SubscriptionPlan): void {
    this.selectedModalPlan.set(plan);
    document.body.style.overflow = 'hidden';
  }

  closeFeatureModal(): void {
    this.selectedModalPlan.set(null);
    document.body.style.overflow = '';
  }

   formatFeature(f: string): string {
    if (f === 'web_ai_bg_removal') {
      return 'Ai Auto Backround removal';
    }
    const parts = f.split('_');
    const prefix = parts[0];
    const moduleMap: Record<string, string> = {
      'inv': 'Inventory Management',
      'sell': 'Point of Sale (Billing)',
      'web': 'Website Builder',
      'cust': 'Customer CRM',
      'staff': 'Staff Management',
      'fin': 'Finance',
      'acc': 'Accounting',
      'mktg': 'Marketing',
      'rep': 'Reports & Analytics'
    };

    if (moduleMap[prefix]) {
      return parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    } else {
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
  }

  // --- Custom Plan Modal Logic ---
  openCustomPlanModal() {
    console.log("Contact Sales button clicked!");
    this.isCustomPlanModalOpen.set(true);
    this.customPlanSuccessMessage.set('');
    this.customPlanErrorMessage.set('');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
  
  closeCustomPlanModal() {
    this.isCustomPlanModalOpen.set(false);
    document.body.style.overflow = '';
  }
  
  toggleCustomFeature(featureKey: string) {
    const selected = new Set(this.selectedCustomFeatures());
    if (selected.has(featureKey)) {
      selected.delete(featureKey);
    } else {
      selected.add(featureKey);
    }
    this.selectedCustomFeatures.set(selected);
  }
  
  private getApiUrl(): string {
    return environment.apiUrl;
  }

  async submitCustomPlanRequest() {
    const form = this.customPlanForm;
    if (!form.contactName || !form.shopName || !form.email || !form.phone) {
      this.customPlanErrorMessage.set('All fields are required.');
      return;
    }
    
    this.isSubmittingCustomPlan.set(true);
    this.customPlanErrorMessage.set('');
    
    try {
      // In a real app, you would call a service method here:
      // await this.planService.createCustomPlanRequest({...})
      
      const response = await fetch(`${this.getApiUrl()}/plans/custom-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          selectedFeatures: Array.from(this.selectedCustomFeatures()),
          estimatedMonthlyPrice: this.estimatedCustomPrice()
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit request');
      
      this.customPlanSuccessMessage.set('Your custom plan request has been submitted successfully! Our team will assign it to your shop shortly.');
      
      // Reset form
      this.customPlanForm = { contactName: '', shopName: '', email: '', phone: '' };
      this.selectedCustomFeatures.set(new Set());
      
      setTimeout(() => this.closeCustomPlanModal(), 3000);
      
    } catch (error) {
      this.customPlanErrorMessage.set('Something went wrong. Please try again later.');
    } finally {
      this.isSubmittingCustomPlan.set(false);
    }
  }

  ngOnInit(): void {
    this.fetchPlans();
  }

  fetchPlans(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.planService.getPlans(true).subscribe({
      next: (response) => {
        let sortedPlans = (response.data || [])
          .filter(p => p.id !== 'free' && p.id !== 'trial')
          .sort((a, b) => {
            const priceA = a.monthlyPrice ?? Infinity;
            const priceB = b.monthlyPrice ?? Infinity;
            return priceA - priceB;
          });
          
        sortedPlans = sortedPlans.map(p => {
          if (p.id === 'starter') {
            p.badge = '⭐ Most Popular';
            p.featured = true;
          }
          if (p.id === 'growth') {
            p.badge = '🔥 Best Value';
            p.featured = true;
          }
          if (p.id === 'custom' || p.monthlyPrice === null || p.price === null) {
            p.isCustom = true;
          }
          return p;
        });
          
        this.startBusinessPlans.set(sortedPlans.filter(p => p.monthlyPrice !== null && p.monthlyPrice <= 450));
        this.growBusinessPlans.set(sortedPlans.filter(p => p.monthlyPrice !== null && p.monthlyPrice > 450 && p.monthlyPrice <= 1050));
        this.enterpriseBusinessPlans.set(sortedPlans.filter(p => p.isCustom || (p.monthlyPrice !== null && p.monthlyPrice > 1050)));
        
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching plans:', err);
        this.error.set('Failed to load pricing plans. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }
}
