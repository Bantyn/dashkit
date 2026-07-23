import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-credit-wallet-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" *ngIf="isOpen">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <div>
            <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              <i class="bi bi-wallet2 text-primary-600"></i> Credit Wallet
            </h3>
            <p class="text-sm text-gray-500 mt-1">Manage your SMS and WhatsApp platform credits</p>
          </div>
          <button (click)="close()" class="text-gray-400 hover:bg-gray-200 p-2 rounded-xl transition-colors">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          <!-- Balance Cards -->
          <div class="grid grid-cols-2 gap-4 mb-8">
            <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">SMS Credits</span>
                <span class="text-2xl font-bold text-gray-900">{{ wallet?.smsCredits || 0 }}</span>
              </div>
              <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                <i class="bi bi-chat-text"></i>
              </div>
            </div>
            
            <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">WhatsApp Credits</span>
                <span class="text-2xl font-bold text-gray-900">{{ wallet?.whatsappCredits || 0 }}</span>
              </div>
              <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl">
                <i class="bi bi-whatsapp"></i>
              </div>
            </div>
          </div>

          <!-- Purchase Packs -->
          <h4 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <i class="bi bi-cart3"></i> Purchase Packs
          </h4>
          
          <div class="space-y-4">
            @if (loading) {
              <div class="text-center text-gray-500 py-8">Loading packs...</div>
            } @else if (packs.length === 0) {
              <div class="text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed border-gray-200">
                No credit packs available at the moment.
              </div>
            } @else {
              <div class="grid grid-cols-2 gap-4">
                @for (pack of packs; track pack.id) {
                  <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:border-primary-500 hover:shadow-md transition-all cursor-pointer group" (click)="purchase(pack)">
                    <div class="flex justify-between items-start mb-4">
                      <div>
                        <span [class]="pack.type === 'sms' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'" class="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                          {{ pack.type }}
                        </span>
                        <h5 class="font-bold text-gray-900">{{ pack.name }}</h5>
                      </div>
                      <span class="text-lg font-bold text-primary-600">₹{{ pack.price }}</span>
                    </div>
                    
                    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      <span class="text-sm text-gray-600"><strong>{{ pack.credits }}</strong> Credits</span>
                      <button class="text-sm font-medium text-primary-600 group-hover:text-primary-700 transition-colors">
                        Buy Now <i class="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class CreditWalletModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  wallet: any = null;
  packs: any[] = [];
  loading = false;
  shopId: string | undefined;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        if (this.isOpen) {
          this.loadData();
        }
      }
    });
  }

  ngOnChanges() {
    if (this.isOpen && this.shopId) {
      this.loadData();
    }
  }

  loadData() {
    this.loading = true;
    
    // Load Wallet
    this.http.get<any>(`${environment.apiUrl}/wallet/shop/${this.shopId}`).subscribe({
      next: (res) => {
        this.wallet = res.data;
      },
      error: () => this.toast.showError('Failed to load wallet balance')
    });

    // Load Packs
    this.http.get<any>(`${environment.apiUrl}/wallet/packs`).subscribe({
      next: (res) => {
        this.packs = res.data.filter((p: any) => p.isActive);
        this.loading = false;
      },
      error: () => {
        this.toast.showError('Failed to load packs');
        this.loading = false;
      }
    });
  }

  purchase(pack: any) {
    if (!confirm(`Are you sure you want to purchase ${pack.name} for ₹${pack.price}?`)) return;
    
    // 1. Create Wallet Order
    this.http.post<any>(`${environment.apiUrl}/wallet/shop/${this.shopId}/purchase/create-order`, {
      packId: pack.id
    }).subscribe({
      next: (res) => {
        const orderData = res.data;
        this.openRazorpay(orderData, pack);
      },
      error: () => this.toast.showError('Failed to initialize payment')
    });
  }

  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  private async openRazorpay(orderData: any, pack: any) {
    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded) {
      this.toast.showError('Razorpay SDK failed to load. Are you online?');
      return;
    }

    // Prepare shop data for prefill
    let userDetails: any = {};
    try {
      // Basic fallback
      userDetails = {
        name: 'Shop Owner',
        email: '',
        contact: ''
      };
    } catch(e) {}

    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Clothify Wallet',
      description: `Purchase ${pack.name}`,
      order_id: orderData.order_id,
      prefill: userDetails,
      theme: {
        color: '#2563eb' // primary-600
      },
      handler: (response: any) => {
        this.verifyPayment(response, pack, orderData.order_id);
      },
      modal: {
        ondismiss: () => {
          this.toast.showWarning('Payment cancelled');
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      this.toast.showError(`Payment failed: ${response.error.description}`);
    });
    rzp.open();
  }

  private verifyPayment(response: any, pack: any, orderId: string) {
    const payload = {
      packId: pack.id,
      paymentId: response.razorpay_payment_id,
      orderId: response.razorpay_order_id,
      signature: response.razorpay_signature
    };

    this.http.post<any>(`${environment.apiUrl}/wallet/shop/${this.shopId}/purchase/verify`, payload).subscribe({
      next: () => {
        this.toast.showSuccess(`Purchased ${pack.name} successfully!`);
        this.loadData();
      },
      error: () => this.toast.showError('Failed to verify payment')
    });
  }

  close() {
    this.isOpen = false;
    this.closed.emit();
  }
}
