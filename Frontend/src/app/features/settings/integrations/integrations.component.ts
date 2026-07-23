import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { FeatureGuardService } from '../../../core/services/feature-guard.service';
import { ShopService } from '../../../core/services/shop.service';
import { HasFeatureDirective } from '../../../core/directives/has-feature.directive';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'messaging' | 'storage' | 'email' | 'shipping' | 'analytics' | 'other';
  connected: boolean;
  fields: { name: string; label: string; type: string; placeholder: string }[];
  requiredFeature?: string;
  hasAccess?: boolean;
}

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasFeatureDirective],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
      <main class="p-6 lg:p-10 max-w-full mx-auto">
        <div class="mb-8 flex justify-between items-end">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Integrations</h1>
            <p class="text-gray-500 mt-1">
              Connect your shop with third-party services to grow and automate.
            </p>
          </div>
          <div class="flex bg-white p-1 rounded-xl border border-gray-200">
            <button
              *ngFor="let cat of categories"
              (click)="activeCategory = cat.id"
              [class]="
                activeCategory === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-500 hover:text-primary-600'
              "
              class="px-4 py-2 text-xs font-normal tracking-wide rounded-lg transition-all"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Integrations Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ng-container *ngFor="let item of filteredIntegrations">
            <div
              *appHasFeature="item.requiredFeature || null"
              class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div class="p-6 flex-1">
                <div class="flex justify-between items-start mb-4">
                  <div
                  class="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100"
                >
                  <i [class]="'bi ' + item.icon + ' text-2xl text-gray-700'"></i>
                </div>
                <span
                  *ngIf="item.connected"
                  class="bg-green-100 text-green-700 text-[10px] font-normal tracking-wide px-2 py-1 rounded-full border border-green-200"
                >
                  Connected
                </span>
                <span
                  *ngIf="!item.connected"
                  class="bg-gray-50 text-gray-400 text-[10px] font-normal tracking-wide px-2 py-1 rounded-full border border-gray-100"
                >
                  Not Connected
                </span>
              </div>
              <h3 class="font-bold text-gray-900">{{ item.name }}</h3>
              <p class="text-xs text-gray-500 mt-1 leading-relaxed">{{ item.description }}</p>
            </div>

            <div class="px-6 pb-6 pt-2">
              <button
                (click)="openConfig(item)"
                class="w-full py-2.5 rounded-xl border font-medium text-xs transition-colors"
                [class]="
                  item.connected
                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    : 'bg-primary-600 text-white border-transparent hover:bg-primary-800'
                "
              >
                {{ item.connected ? 'Configure Integration' : 'Connect Now' }}
              </button>
            </div>
          </div>
          </ng-container>
        </div>

        <!-- Configuration Modal -->
        <div
          *ngIf="selectedItem"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div
            class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
          >
            <div class="p-8 border-b border-gray-100 flex justify-between items-center">
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100"
                >
                  <i [class]="'bi ' + selectedItem.icon + ' text-2xl text-gray-700'"></i>
                </div>
                <div>
                  <h3 class="font-bold text-xl text-gray-900">{{ selectedItem.name }}</h3>
                  <p class="text-xs text-gray-500">Integration Configuration</p>
                </div>
              </div>
              <button
                (click)="closeConfig()"
                class="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="p-8 space-y-4">
              <div *ngFor="let field of selectedItem.fields">
                <label
                  class="block text-xs font-normal tracking-wide text-gray-400 mb-1.5"
                  >{{ field.label }}</label
                >
                <input
                  [formControlName]="field.name"
                  [type]="field.type"
                  [placeholder]="field.placeholder"
                  class="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all font-mono"
                />
              </div>

              <div class="flex gap-3 pt-6">
                <button
                  *ngIf="selectedItem.connected"
                  type="button"
                  (click)="disconnect()"
                  class="flex-1 py-3 text-red-600 font-medium text-sm bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  Disconnect
                </button>
                <button
                  type="submit"
                  [disabled]="saving"
                  class="flex-[2] py-3 bg-primary-600 text-white font-medium text-sm hover:bg-black rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span
                    *ngIf="saving"
                    class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"
                  ></span>
                  {{ selectedItem.connected ? 'Update Settings' : 'Connect Service' }}
                </button>
              </div>
              <p class="text-[10px] text-gray-400 text-center mt-4">
                API keys are stored encrypted and never exposed to the public.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class IntegrationsComponent implements OnInit {
  activeCategory = 'all';
  saving = false;
  selectedItem: Integration | null = null;
  configForm: FormGroup;
  shopId: string = '';

  categories = [
    { id: 'all', label: 'All' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'storage', label: 'Cloud Storage' },
    { id: 'email', label: 'Email' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'analytics', label: 'Analytics' },
  ];

  integrations: Integration[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business API',
      description: 'Send automated order notifications and chat with customers directly.',
      icon: 'bi-whatsapp',
      category: 'messaging',
      connected: false,
      requiredFeature: 'mktg_whatsapp',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API Key' },
        {
          name: 'phoneNumberId',
          label: 'Phone Number ID',
          type: 'text',
          placeholder: 'e.g. 109238129',
        },
        {
          name: 'businessAccountId',
          label: 'Business Account ID',
          type: 'text',
          placeholder: 'e.g. 293812938',
        },
      ],
    },
    {
      id: 'twilio',
      name: 'Twilio SMS',
      description: 'Global SMS and WhatsApp messaging for order updates.',
      icon: 'bi-chat-dots',
      category: 'messaging',
      connected: false,
      requiredFeature: 'mktg_sms',
      fields: [
        { name: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'ACxxxx...' },
        { name: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Enter Token' },
        { name: 'senderNumber', label: 'Sender Number', type: 'text', placeholder: '+1234567890' },
      ],
    },
    {
      id: 'cloudinary',
      name: 'Cloudinary',
      description: 'Dynamic image optimization and hosting for your product catalog.',
      icon: 'bi-cloud-upload',
      category: 'storage',
      connected: false,
      requiredFeature: 'inv_product_listing',
      fields: [
        { name: 'cloudName', label: 'Cloud Name', type: 'text', placeholder: 'e.g. clothify' },
        { name: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Enter Key' },
        { name: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Enter Secret' },
      ],
    },
    {
      id: 'awsS3',
      name: 'AWS S3',
      description: 'Industrial-grade cloud storage for your assets and backups.',
      icon: 'bi-clouds',
      category: 'storage',
      connected: false,
      requiredFeature: 'ent_multi_branch',
      fields: [
        { name: 'accessKeyId', label: 'Access Key ID', type: 'text', placeholder: 'AKIA...' },
        {
          name: 'accessKeySecret',
          label: 'Secret Key',
          type: 'password',
          placeholder: 'Enter Secret',
        },
        { name: 'bucket', label: 'Bucket Name', type: 'text', placeholder: 'clothify-assets' },
        { name: 'region', label: 'Region', type: 'text', placeholder: 'ap-south-1' },
      ],
    },
    {
      id: 'smtp',
      name: 'Custom SMTP',
      description: 'Send emails from your own domain using custom SMTP server.',
      icon: 'bi-envelope-at',
      category: 'email',
      connected: false,
      requiredFeature: 'mktg_templates',
      fields: [
        { name: 'host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com' },
        { name: 'port', label: 'Port', type: 'number', placeholder: '587' },
        { name: 'user', label: 'Username', type: 'text', placeholder: 'user@example.com' },
        { name: 'smtpPass', label: 'Password', type: 'password', placeholder: 'Enter Password' },
        { name: 'fromName', label: 'From Name', type: 'text', placeholder: 'Clothify Shop' },
      ],
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'High-deliverability email service for transactional notifications.',
      icon: 'bi-send-check',
      category: 'email',
      connected: false,
      requiredFeature: 'mktg_templates',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'SG.xxx...' },
        {
          name: 'fromEmail',
          label: 'Verified From Email',
          type: 'text',
          placeholder: 'hello@clothify.shop',
        },
      ],
    },
    {
      id: 'delhivery',
      name: 'Delhivery',
      description: 'India-wide logistics provider for fast shipping fulfillment.',
      icon: 'bi-box-seam',
      category: 'shipping',
      connected: false,
      requiredFeature: 'ship_setup',
      fields: [
        { name: 'apiKey', label: 'API Token', type: 'password', placeholder: 'Enter Token' },
      ],
    },
    {
      id: 'googleAnalytics',
      name: 'Google Analytics 4',
      description: 'Track website traffic and customer behavior in real-time.',
      icon: 'bi-bar-chart-line',
      category: 'analytics',
      connected: false,
      requiredFeature: 'analytics_dashboard',
      fields: [
        {
          name: 'measurementId',
          label: 'G- Measurement ID',
          type: 'text',
          placeholder: 'G-XXXXXXXX',
        },
      ],
    },
  ];

  private featureGuard = inject(FeatureGuardService);
  private shopService = inject(ShopService);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
  ) {
    this.configForm = this.fb.group({});
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      const id = params.get('shopId');
      if (id) {
        this.shopId = id;
        this.loadIntegrationsStatus();
      }
    });
  }

  get filteredIntegrations() {
    let list = this.integrations;
    if (this.activeCategory !== 'all') {
      list = list.filter((i) => i.category === this.activeCategory);
    }
    return list;
  }

  loadIntegrationsStatus() {
    if (!this.shopId) return;

    this.http
      .get<{ data: any }>(`${environment.apiUrl}/shops/${this.shopId}/integrations`)
      .subscribe((res) => {
        this.integrations.forEach((item) => {
          if (res.data[item.id]) {
            item.connected = res.data[item.id].connected ?? true;
          }
        });
      });
  }

  openConfig(item: Integration) {
    this.selectedItem = item;
    const controls: any = {};
    item.fields.forEach((f) => {
      controls[f.name] = ['', Validators.required];
    });
    this.configForm = this.fb.group(controls);
  }

  closeConfig() {
    this.selectedItem = null;
  }

  saveConfig() {
    if (this.configForm.invalid || !this.shopId) return;

    const provider = this.selectedItem?.id;
    if (!provider) return;

    this.saving = true;
    const config = { ...this.configForm.value, connected: true };

    this.http
      .put(`${environment.apiUrl}/shops/${this.shopId}/integrations`, { provider, config })
      .subscribe({
        next: () => {
          if (this.selectedItem) this.selectedItem.connected = true;
          this.saving = false;
          this.closeConfig();
        },
        error: () => (this.saving = false),
      });
  }

  disconnect() {
    if (!this.shopId) return;
    const provider = this.selectedItem?.id;
    if (!provider) return;

    this.http
      .delete(`${environment.apiUrl}/shops/${this.shopId}/integrations/${provider}`)
      .subscribe(() => {
        if (this.selectedItem) this.selectedItem.connected = false;
        this.closeConfig();
      });
  }
}
