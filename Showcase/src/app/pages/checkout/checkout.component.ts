import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanService, SubscriptionPlan } from '../../services/plan.service';
import { FormsModule } from '@angular/forms';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private planService = inject(PlanService);

  plan = signal<SubscriptionPlan | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  selectedPeriod = signal<number>(12); // default to 12 months for best savings
  branchCount = signal<number>(1);
  includedBranches = signal<number>(1);
  maxBranches = signal<number>(1);
  hasBranchFeature = signal<boolean>(false);
  hasWebsiteFeature = signal<boolean>(false);
  includeDomain = signal<boolean>(false);
  branchPricePerMonth = 500;
  domainCostPerMonth = 29;

  periods = [
    { months: 1, discountPercent: 0 },
    { months: 12, discountPercent: 10 }
  ];

  baseMonthlyPrice = computed(() => this.plan()?.monthlyPrice || 0);

  getPeriodDetails(months: number) {
    const periodData = this.periods.find(p => p.months === months);
    const discount = periodData?.discountPercent || 0;
    const originalPrice = this.baseMonthlyPrice();
    const discountedPrice = originalPrice - (originalPrice * (discount / 100));
    return {
      months,
      discount,
      originalPrice,
      discountedPrice,
      totalSave: (originalPrice - discountedPrice) * months
    };
  }

  currentPeriodDetails = computed(() => this.getPeriodDetails(this.selectedPeriod()));

  domainCost = computed(() => {
    return this.includeDomain() ? this.domainCostPerMonth * this.selectedPeriod() : 0;
  });

  subtotal = computed(() => {
    const period = this.currentPeriodDetails();
    const planCost = period.discountedPrice * period.months;
    const branchesCost = (this.branchCount() - this.includedBranches()) * this.branchPricePerMonth * period.months;
    const domainCost = this.domainCost();
    return planCost + (branchesCost > 0 ? branchesCost : 0) + domainCost;
  });

  taxes = computed(() => {
    return this.subtotal() * 0.18; // 18% GST
  });

  total = computed(() => {
    return this.subtotal() + this.taxes();
  });
  
  trialEndDate = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const planId = params.get('planId');
      if (planId) {
        this.fetchPlan(planId);
      } else {
        this.error.set('No plan selected');
        this.isLoading.set(false);
      }
    });
  }

  fetchPlan(id: string): void {
    this.isLoading.set(true);
    this.planService.getPlan(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.plan.set(response.data);
          
          const limitBranches = response.data.limits?.['branch_count'];
          const hasBranch = response.data.features && (
            response.data.features.includes('ent_multi_branch') ||
            response.data.features.includes('multi_branch')
          );
          
          if (hasBranch && typeof limitBranches === 'number' && (limitBranches > 1 || limitBranches === -1)) {
            this.hasBranchFeature.set(true);
            this.includedBranches.set(1);
            this.maxBranches.set(limitBranches);
            this.branchCount.set(1);
          } else {
            this.hasBranchFeature.set(false);
          }

          if (response.data.features && response.data.features.some(f => f.startsWith('web_'))) {
            this.hasWebsiteFeature.set(true);
          } else {
            this.hasWebsiteFeature.set(false);
          }
        } else {
          this.error.set('Plan not found.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Error fetching plan details.');
        this.isLoading.set(false);
      }
    });
  }

  incrementBranch() {
    this.branchCount.update(c => {
      if (this.maxBranches() === -1) return c + 1;
      return c < this.maxBranches() ? c + 1 : c;
    });
  }

  decrementBranch() {
    this.branchCount.update(c => c > this.includedBranches() ? c - 1 : this.includedBranches());
  }

  toggleDomain() {
    this.includeDomain.update(v => !v);
  }

  selectPeriod(months: number) {
    this.selectedPeriod.set(months);
  }

  groupedFeatures = computed(() => {
    const features = this.plan()?.features || [];
    const groups: { [key: string]: string[] } = {};
    
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

    features.forEach(f => {
      const parts = f.split('_');
      const prefix = parts[0];
      const moduleName = moduleMap[prefix] || 'General Features';
      
      let label = f;
      if (moduleMap[prefix]) {
        label = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      } else {
        label = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      }

      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }
      groups[moduleName].push(label);
    });

    return Object.keys(groups).map(key => ({
      module: key,
      features: groups[key]
    }));
  });

  continueToPayment() {
    if (!this.plan()) return;
    const code = this.plan()?.code;
    const period = this.selectedPeriod();
    const branches = this.branchCount();
    const domain = this.includeDomain();
    
    window.location.href = `${environment.dashboardUrl}/register?plan=${code}&period=${period}&branches=${branches}&domain=${domain}`;
  }
}
