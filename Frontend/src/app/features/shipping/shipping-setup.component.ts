import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ShippingService,
  ShiprocketStatus,
  PickupLocation,
} from '../../core/services/shipping.service';
import { UiLoadingComponent } from '../../shared/components/ui-loading.component';
import { ConfirmationService } from '../../shared/components/confirmation-modal.component';

@Component({
  selector: 'app-shipping-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiLoadingComponent],
  template: `
    <div class="flex-1 overflow-y-auto bg-gray-50 h-full">
      <main class="p-6 md:p-8 max-w-full mx-auto space-y-6">
        <!-- Page Header -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Shipping Setup</h2>
            <p class="text-sm text-gray-500 mt-1">
              Connect your Shiprocket account to enable order shipping.
            </p>
          </div>
          <!-- Status Badge -->
          @if (!loadingStatus) {
            <span [class]="statusBadgeClass">
              <span class="w-2 h-2 rounded-full" [class]="statusDotClass"></span>
              {{ statusLabel }}
            </span>
          }
        </div>

        <!-- Loading state -->
        @if (loadingStatus) {
          <div class="flex justify-center p-12">
            <app-ui-loading size="md"></app-ui-loading>
          </div>
        } @else {
          <!-- ── Connect / Reconnect Card ── -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <i class="bi bi-plug-fill text-indigo-600 text-lg"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">
                  {{
                    status?.status === 'connected'
                      ? 'Update Credentials'
                      : 'Connect Shiprocket Account'
                  }}
                </h3>
                <p class="text-xs text-gray-500">
                  {{
                    status?.email
                      ? 'Currently connected as: ' + status!.email
                      : 'Enter your Shiprocket login credentials.'
                  }}
                </p>
              </div>
            </div>

            <form [formGroup]="connectForm" (ngSubmit)="onConnect()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Shiprocket Email</label>
                <input
                  type="email"
                  formControlName="email"
                  placeholder="you@example.com"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Shiprocket Password</label
                >
                <input
                  type="password"
                  formControlName="password"
                  placeholder="••••••••"
                  class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm"
                />
              </div>

              @if (connectError) {
                <div
                  class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
                >
                  <i class="bi bi-exclamation-circle-fill mt-0.5 flex-shrink-0"></i>
                  <span>{{ connectError }}</span>
                </div>
              }

              <div class="flex gap-3 pt-1">
                <button
                  type="submit"
                  [disabled]="connectForm.invalid || connecting"
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  @if (connecting) {
                    <div
                      class="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full"
                    ></div>
                  } @else {
                    <i class="bi bi-plug-fill"></i>
                  }
                  {{
                    connecting
                      ? 'Connecting...'
                      : status?.status === 'connected'
                        ? 'Reconnect'
                        : 'Connect Account'
                  }}
                </button>

                @if (status?.status === 'connected') {
                  <button
                    type="button"
                    (click)="onDisconnect()"
                    [disabled]="disconnecting"
                    class="px-4 py-2.5 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
                  >
                    {{ disconnecting ? 'Disconnecting...' : 'Disconnect' }}
                  </button>
                }
              </div>
            </form>
          </div>

          <!-- ── Test Connection Card ── -->
          @if (status?.status === 'connected') {
            <div
              class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between gap-4"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <i class="bi bi-wifi text-green-600 text-lg"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">Test Connection</h3>
                  <p class="text-xs text-gray-500">
                    Verify that your Shiprocket credentials are still valid.
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0">
                @if (testResult !== null) {
                  <span
                    [class]="
                      testResult
                        ? 'text-green-600 text-sm font-medium'
                        : 'text-red-600 text-sm font-medium'
                    "
                  >
                    <i [class]="testResult ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
                    {{ testResult ? 'Connection OK' : 'Test Failed' }}
                  </span>
                }
                <button
                  (click)="onTest()"
                  [disabled]="testing"
                  class="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
                >
                  @if (testing) {
                    <div
                      class="animate-spin h-4 w-4 border-2 border-gray-500 border-b-transparent rounded-full"
                    ></div>
                  } @else {
                    <i class="bi bi-arrow-repeat"></i>
                  }
                  {{ testing ? 'Testing...' : 'Test Connection' }}
                </button>
              </div>
            </div>
          }

          <!-- ── Pickup Locations Card ── -->
          @if (status?.status === 'connected') {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <i class="bi bi-geo-alt-fill text-amber-600 text-lg"></i>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900">Pickup Locations</h3>
                    <p class="text-xs text-gray-500">
                      Select the default pickup location for your shipments.
                    </p>
                  </div>
                </div>
                <button
                  (click)="loadPickupLocations()"
                  [disabled]="loadingLocations"
                  class="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <i class="bi bi-arrow-repeat" [class.animate-spin]="loadingLocations"></i>
                  Refresh
                </button>
              </div>

              @if (loadingLocations) {
                <div class="flex justify-center py-6">
                  <app-ui-loading size="sm"></app-ui-loading>
                </div>
              } @else if (pickupLocations.length === 0) {
                <div class="text-center py-6 text-gray-400 text-sm">
                  <i class="bi bi-geo-alt text-3xl block mb-2"></i>
                  No pickup locations found. Add one in your Shiprocket dashboard.
                </div>
              } @else {
                <div class="space-y-2">
                  @for (loc of pickupLocations; track loc.id) {
                    <div
                      (click)="selectedLocation = loc.pickup_location"
                      class="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                      [class.border-indigo-500]="selectedLocation === loc.pickup_location"
                      [class.bg-indigo-50]="selectedLocation === loc.pickup_location"
                      [class.border-gray-100]="selectedLocation !== loc.pickup_location"
                      [class.hover:border-gray-300]="selectedLocation !== loc.pickup_location"
                    >
                      <div
                        class="w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center"
                        [class.border-indigo-500]="selectedLocation === loc.pickup_location"
                        [class.border-gray-300]="selectedLocation !== loc.pickup_location"
                      >
                        @if (selectedLocation === loc.pickup_location) {
                          <div class="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-semibold text-sm text-gray-900">
                          {{ loc.name || loc.pickup_location }}
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5">
                          {{ loc.address }}, {{ loc.city }}, {{ loc.state }} - {{ loc.pin_code }}
                        </p>
                        @if (status?.defaultPickupLocation === loc.pickup_location) {
                          <span
                            class="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"
                            >Default</span
                          >
                        }
                      </div>
                    </div>
                  }
                </div>

                @if (locationSaveError) {
                  <p class="text-red-600 text-sm">{{ locationSaveError }}</p>
                }

                <button
                  (click)="onSavePickupLocation()"
                  [disabled]="
                    !selectedLocation ||
                    savingLocation ||
                    selectedLocation === status?.defaultPickupLocation
                  "
                  class="w-full mt-2 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  @if (savingLocation) {
                    <span class="flex items-center justify-center gap-2">
                      <div
                        class="animate-spin h-4 w-4 border-2 border-white border-b-transparent rounded-full"
                      ></div>
                      Saving...
                    </span>
                  } @else {
                    Set as Default Pickup Location
                  }
                </button>
              }
            </div>
          }
        }
      </main>
    </div>
  `,
})
export class ShippingSetupComponent implements OnInit {
  shopId: string | null = null;
  status: ShiprocketStatus | null = null;
  pickupLocations: PickupLocation[] = [];
  selectedLocation: string | null = null;

  loadingStatus = true;
  loadingLocations = false;
  connecting = false;
  disconnecting = false;
  testing = false;
  savingLocation = false;

  connectError: string | null = null;
  locationSaveError: string | null = null;
  testResult: boolean | null = null;

  connectForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private shippingService: ShippingService,
    private confirmationService: ConfirmationService,
  ) {
    this.connectForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.shopId = params.get('shopId');
      if (this.shopId) this.loadStatus();
    });
  }

  // Derive shopId from current route if parent param not available
  private resolveShopId(): string | null {
    if (this.shopId) return this.shopId;
    const segments = window.location.pathname.split('/').filter(Boolean);
    return segments[0] || null;
  }

  loadStatus() {
    const id = this.resolveShopId();
    if (!id) return;
    this.loadingStatus = true;
    this.shippingService.getStatus(id).subscribe({
      next: (res) => {
        this.status = res.data;
        this.selectedLocation = this.status?.defaultPickupLocation || null;
        this.loadingStatus = false;
        if (this.status?.status === 'connected') this.loadPickupLocations();
      },
      error: () => {
        this.loadingStatus = false;
      },
    });
  }

  loadPickupLocations() {
    const id = this.resolveShopId();
    if (!id) return;
    this.loadingLocations = true;
    this.shippingService.getPickupLocations(id).subscribe({
      next: (res) => {
        this.pickupLocations = res.data.pickupLocations || [];
        this.loadingLocations = false;
      },
      error: () => {
        this.loadingLocations = false;
      },
    });
  }

  onConnect() {
    if (this.connectForm.invalid) return;
    const id = this.resolveShopId();
    if (!id) return;

    this.connecting = true;
    this.connectError = null;
    const { email, password } = this.connectForm.value;

    this.shippingService.connectShiprocket(id, email, password).subscribe({
      next: (res) => {
        this.connecting = false;
        this.connectForm.reset();
        this.pickupLocations = res.data?.pickupLocations || [];
        this.loadStatus();
      },
      error: (err) => {
        this.connecting = false;
        this.connectError =
          err.error?.error?.message || 'Failed to connect. Check your credentials.';
      },
    });
  }

  onTest() {
    const id = this.resolveShopId();
    if (!id) return;
    this.testing = true;
    this.testResult = null;
    this.shippingService.testConnection(id).subscribe({
      next: () => {
        this.testing = false;
        this.testResult = true;
        setTimeout(() => (this.testResult = null), 4000);
      },
      error: () => {
        this.testing = false;
        this.testResult = false;
        setTimeout(() => (this.testResult = null), 4000);
      },
    });
  }

  onSavePickupLocation() {
    const id = this.resolveShopId();
    if (!id || !this.selectedLocation) return;
    this.savingLocation = true;
    this.locationSaveError = null;
    this.shippingService.setDefaultPickupLocation(id, this.selectedLocation).subscribe({
      next: () => {
        this.savingLocation = false;
        if (this.status) this.status.defaultPickupLocation = this.selectedLocation;
      },
      error: (err) => {
        this.savingLocation = false;
        this.locationSaveError = err.error?.error?.message || 'Failed to save pickup location.';
      },
    });
  }

  async onDisconnect() {
    const id = this.resolveShopId();
    if (!id) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Disconnect Shiprocket?',
      description: 'Are you sure you want to disconnect your Shiprocket account?',
      type: 'danger',
      primaryButtonText: 'Disconnect',
      secondaryButtonText: 'Cancel',
    });
    if (!confirmed) return;

    this.disconnecting = true;
    this.shippingService.disconnect(id).subscribe({
      next: () => {
        this.disconnecting = false;
        this.status = null;
        this.pickupLocations = [];
        this.loadStatus();
      },
      error: () => {
        this.disconnecting = false;
      },
    });
  }

  get statusBadgeClass(): string {
    const base = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ';
    switch (this.status?.status) {
      case 'connected':
        return base + 'bg-green-50 text-green-700 border-green-200';
      case 'token_expired':
        return base + 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return base + 'bg-red-50 text-red-700 border-red-200';
    }
  }

  get statusDotClass(): string {
    switch (this.status?.status) {
      case 'connected':
        return 'bg-green-500';
      case 'token_expired':
        return 'bg-amber-500';
      default:
        return 'bg-red-500';
    }
  }

  get statusLabel(): string {
    switch (this.status?.status) {
      case 'connected':
        return 'Connected';
      case 'token_expired':
        return 'Token Expired';
      default:
        return 'Not Connected';
    }
  }
}
