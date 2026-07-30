import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { WebsiteService } from "../../core/services/website.service";
import { CartService } from "../../core/services/cart.service";
import { TenantService } from "../../core/services/tenant.service";
import { AuthService } from "../../core/services/auth.service";
import { ShopContextService } from "../../core/services/shop-context.service";
import { ToastService } from "../../core/services/toast.service";
import { Product, ProductVariant } from "../../core/models/product.model";
import { Observable, BehaviorSubject } from "rxjs";
import { switchMap, tap, map, shareReplay, take } from "rxjs/operators";
import { FormsModule } from "@angular/forms";
import { UiLoadingComponent } from "../../shared/components/ui-loading.component";
import { OptimizeImagePipe } from "../../shared/pipes/optimize-image.pipe";
import { ReviewSummaryCardComponent } from "../../shared/components/review-summary-card.component";

@Component({
  selector: "app-product-detail",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    UiLoadingComponent,
    OptimizeImagePipe,
    ReviewSummaryCardComponent,
  ],
  providers: [OptimizeImagePipe],
  template: `
    <div class="bg-white min-h-screen pt-4 pb-24 text-primary-900">
      <div class="container mx-auto px-4 max-w-7xl animate-fade-in-up">
        <ng-container *ngIf="product$ | async as product; else loading">
          <!-- Premium Minimal Breadcrumb -->
          <nav
            class="flex items-center text-xs font-bold tracking-wider uppercase text-gray-400 mb-6 mt-4"
          >
            <a
              [routerLink]="routePrefix"
              class="hover:text-black transition-colors"
              >Home</a
            >
            <span class="mx-2 text-primary-300">/</span>
            <a
              [routerLink]="routePrefix.concat(['products'])"
              class="hover:text-black transition-colors"
              >Collection</a
            >
            <span class="mx-2 text-primary-300">/</span>
            <span class="text-primary-900 capitalize">{{ product.category }}</span>
          </nav>

          <!-- Main Layout Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">
            <!-- Left Column: Product Image Gallery -->
            <div class="lg:col-span-7">
              <!-- Desktop stacked images -->
              <div class="hidden lg:flex flex-col gap-6 w-full">
                <div
                  *ngFor="let img of getStackedImages(product)"
                  class="w-full aspect-[3/4] bg-primary/10 overflow-hidden rounded-2xl border border-gray-50 shadow-sm relative group"
                >
                  <img
                    [src]="img | optimizeImage: 'zoom'"
                    class="w-full h-full object-contain transition-transform duration-700 ease-in-out"
                  />
                </div>
              </div>

              <!-- Mobile scrollable carousel -->
              <div
                class="lg:hidden relative w-full aspect-[3/4] bg-primary/10 overflow-hidden mb-6 rounded-2xl"
              >
                <div
                  (scroll)="onMobileScroll($event)"
                  class="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full"
                >
                  <div
                    *ngFor="let img of getStackedImages(product)"
                    class="w-full h-full flex-shrink-0 snap-start"
                  >
                    <img
                      [src]="img | optimizeImage: 'product'"
                      class="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <!-- Carousel Dots -->
                <div
                  class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10"
                >
                  <span
                    *ngFor="
                      let img of getStackedImages(product);
                      let idx = index
                    "
                    class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    [class.bg-primary-900]="currentMobileSlide === idx"
                    [class.bg-primary-900/20]="currentMobileSlide !== idx"
                  ></span>
                </div>
              </div>
            </div>

            <!-- Right Column: Sticky Product Info Panel -->
            <div class="lg:col-span-5">
              <div class="lg:sticky lg:top-24 h-fit text-left">
                <!-- Category/Subcategory text -->
                <span
                  class="text-[10px] font-bold tracking-widest uppercase text-gray-400 block mb-2"
                >
                  {{ product.subcategory || product.category }}
                </span>

                <!-- Product Name -->
                <h1
                  class="text-3xl font-black text-primary-900 tracking-tight mb-3 leading-tight"
                >
                  {{ product.name }}
                </h1>

                <!-- Price -->
                <div class="mb-6 text-left">
                  <ng-container
                    *ngIf="
                      isWholesaleCustomer() &&
                        ((selectedVariant$ | async)?.wholesalePrice ||
                          product.variants[0]?.wholesalePrice);
                      else standardPrice
                    "
                  >
                    <span
                      class="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1"
                    >
                      Wholesale Pricing Active
                    </span>
                    <div class="flex items-baseline gap-2">
                      <span class="text-2xl font-bold text-primary-900">
                        {{
                          (selectedVariant$ | async)?.wholesalePrice ||
                            product.variants[0]?.wholesalePrice
                            | currency: "INR"
                        }}
                      </span>
                      <span class="line-through text-gray-400 text-sm">
                        {{
                          (selectedVariant$ | async)?.price ||
                            product.variants[0]?.price | currency: "INR"
                        }}
                      </span>
                    </div>
                    <span
                      class="text-[11px] text-slate-400 font-medium block mt-1"
                    >
                      Minimum order quantity:
                      {{
                        (selectedVariant$ | async)?.wholesaleMinQty ||
                          product.variants[0]?.wholesaleMinQty ||
                          1
                      }}
                      units
                    </span>
                  </ng-container>
                  <ng-template #standardPrice>
                    <p class="text-xl font-bold text-primary-900">
                      {{
                        (selectedVariant$ | async)?.price ||
                          product.variants[0]?.price | currency: "INR"
                      }}
                    </p>
                  </ng-template>
                </div>

                <!-- Description -->
                <p
                  class="text-sm text-gray-600 leading-relaxed mb-8 font-light"
                >
                  {{
                    product.description ||
                      "Experience premium craftsmanship with our newest arrival. Designed with meticulous attention to detail and uncompromising quality."
                  }}
                </p>

                <!-- Variant Selectors -->
                <div class="space-y-6 mb-8">
                  <!-- Color Selector -->
                  <div *ngIf="hasColors(product)">
                    <label
                      class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2"
                    >
                      Product Color:
                      <span class="text-primary-900 capitalize">{{
                        selectedColor
                      }}</span>
                    </label>
                    <div class="flex flex-wrap gap-2.5">
                      <button
                        *ngFor="let variant of getUniqueColors(product)"
                        (click)="
                          isColorAvailable(product, variant.color!) &&
                            selectColor(variant.color!)
                        "
                        class="w-8 h-8 rounded-full border transition-all flex items-center justify-center focus:outline-none relative"
                        [class.border-black]="selectedColor === variant.color"
                        [class.border-gray-200]="
                          selectedColor !== variant.color
                        "
                        [class.opacity-40]="
                          !isColorAvailable(product, variant.color!)
                        "
                        [class.cursor-not-allowed]="
                          !isColorAvailable(product, variant.color!)
                        "
                        [disabled]="!isColorAvailable(product, variant.color!)"
                      >
                        <span
                          [style.background-color]="getColorHex(variant.color)"
                          class="w-6 h-6 rounded-full block border border-gray-100 shadow-inner"
                        ></span>
                        <div
                          *ngIf="!isColorAvailable(product, variant.color!)"
                          class="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <div
                            class="w-[120%] h-[1px] bg-red-500 rotate-45 z-10"
                          ></div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <!-- Size Selector -->
                  <div *ngIf="hasSizes(product)">
                    <div
                      class="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-400 mb-2"
                    >
                      <span
                        >Product Size:
                        <span class="text-primary-900 uppercase font-extrabold">{{
                          selectedSize || "Select"
                        }}</span></span
                      >
                      <a
                        [routerLink]="routePrefix.concat(['size-guide'])"
                        class="underline text-primary-900 hover:text-gray-600 focus:outline-none text-xs cursor-pointer"
                      >
                        Size Guide
                      </a>
                    </div>
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        *ngFor="let variant of getAvailableSizes(product)"
                        (click)="
                          isSizeAvailable(product, variant.size!) &&
                            selectSize(variant.size!)
                        "
                        class="border py-2.5 text-center text-xs font-semibold uppercase tracking-wider transition-all focus:outline-none rounded-md relative overflow-hidden"
                        [class.border-black]="selectedSize === variant.size"
                        [class.bg-primary-900]="selectedSize === variant.size"
                        [class.text-white]="selectedSize === variant.size"
                        [class.border-gray-200]="selectedSize !== variant.size"
                        [class.text-primary-900]="selectedSize !== variant.size"
                        [class.hover:border-black]="
                          selectedSize !== variant.size &&
                          isSizeAvailable(product, variant.size!)
                        "
                        [disabled]="!isSizeAvailable(product, variant.size!)"
                        [class.opacity-40]="
                          !isSizeAvailable(product, variant.size!)
                        "
                        [class.cursor-not-allowed]="
                          !isSizeAvailable(product, variant.size!)
                        "
                      >
                        {{ variant.size }}
                        <div
                          *ngIf="!isSizeAvailable(product, variant.size!)"
                          class="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <div
                            class="w-[120%] h-[1px] bg-red-500 rotate-12 z-10 opacity-70"
                          ></div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Stock Limit Indicator -->
                <div class="mb-4">
                  <span
                    *ngIf="getMaxStock(product) > 0"
                    class="text-xs text-gray-500 font-medium"
                  >
                    Stock Available:
                    <strong class="text-primary-900">{{
                      getMaxStock(product)
                    }}</strong>
                    items
                  </span>
                  <span
                    *ngIf="getMaxStock(product) <= 0"
                    class="text-xs text-red-600 font-bold uppercase tracking-wider"
                  >
                    Out of Stock
                  </span>
                </div>

                <!-- Purchase Buttons -->
                <div *ngIf="cartEnabled" class="mb-10">
                  <div class="flex gap-4">
                    <!-- Minimalist Quantity Selector capped at stock -->
                    <div
                      class="flex items-center border border-gray-200 rounded-lg overflow-hidden h-12 w-28 bg-white"
                    >
                      <button
                        (click)="quantity = Math.max(1, quantity - 1)"
                        [disabled]="quantity <= 1 || isOutOfStock(product)"
                        class="w-9 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i class="bi bi-dash"></i>
                      </button>
                      <span
                        class="flex-1 text-center font-bold text-sm text-primary-900 select-none"
                      >
                        {{ quantity }}
                      </span>
                      <button
                        (click)="incrementQuantity(product)"
                        [disabled]="
                          quantity >= getMaxStock(product) ||
                          isOutOfStock(product)
                        "
                        class="w-9 h-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i class="bi bi-plus"></i>
                      </button>
                    </div>

                    <!-- Add to Cart Black Button -->
                    <button
                      (click)="addToCart(product)"
                      [disabled]="
                        !isValidSelection(product) ||
                        isAdding ||
                        isOutOfStock(product)
                      "
                      class="flex-[2] bg-primary-900 text-white h-12 rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <ng-container *ngIf="!isAdding">
                        {{
                          isOutOfStock(product) ? "Out of Stock" : "Add to Bag"
                        }}
                      </ng-container>
                      <ng-container *ngIf="isAdding">
                        <span
                          class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"
                        ></span>
                      </ng-container>
                    </button>

                    <!-- Wishlist Button -->
                    <button
                      (click)="toggleFavorite($event, product.id)"
                      class="flex-1 border border-gray-200 bg-white text-primary-900 h-12 rounded-lg font-bold hover:border-primary-300 transition-all flex justify-center items-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <i
                        class="bi text-lg"
                        [class.bi-heart]="!isFavorited(product.id)"
                        [class.bi-heart-fill]="isFavorited(product.id)"
                        [class.text-red-500]="isFavorited(product.id)"
                      ></i>
                    </button>
                  </div>
                </div>

                <!-- Showcase-Only Banner (Free/Plus Plan Shops) -->
                <div
                  *ngIf="!cartEnabled"
                  class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8"
                >
                  <p
                    class="font-bold text-amber-900 text-xs uppercase tracking-wider mb-1"
                  >
                    Showcase Item
                  </p>
                  <p class="text-xs text-amber-700 leading-relaxed">
                    This product is for display only. To purchase or enquire,
                    please contact the shop directly.
                  </p>
                </div>

                <!-- Collapsible Info Accordions -->
                <div class="border-t border-gray-100 pt-2">
                  <!-- Availability -->
                  <div class="border-b border-gray-100 py-4">
                    <button
                      (click)="toggleAccordion('availability')"
                      class="w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider text-primary-900 focus:outline-none"
                    >
                      <span>Check In-Store Availability</span>
                      <i
                        class="bi text-sm transition-transform duration-200"
                        [class.bi-plus]="!accordions.availability"
                        [class.bi-dash]="accordions.availability"
                      ></i>
                    </button>
                    <div
                      *ngIf="accordions.availability"
                      class="mt-3 text-xs text-gray-500 leading-relaxed animate-fade-in"
                    >
                      This item is available in limited quantities at select
                      store locations. Please contact your nearest store branch
                      for stock reservation.
                    </div>
                  </div>

                  <!-- Fit Details -->
                  <div class="border-b border-gray-100 py-4">
                    <button
                      (click)="toggleAccordion('fit')"
                      class="w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider text-primary-900 focus:outline-none"
                    >
                      <span>Fit Details</span>
                      <i
                        class="bi text-sm transition-transform duration-200"
                        [class.bi-plus]="!accordions.fit"
                        [class.bi-dash]="accordions.fit"
                      ></i>
                    </button>
                    <div
                      *ngIf="accordions.fit"
                      class="mt-3 text-xs text-gray-500 leading-relaxed animate-fade-in"
                    >
                      Designed for a relaxed fit, matching standard contemporary
                      sizing. Model is 175cm/5'9" and is wearing size S.
                    </div>
                  </div>

                  <!-- Fabrication & Care -->
                  <div class="border-b border-gray-100 py-4">
                    <button
                      (click)="toggleAccordion('fabric')"
                      class="w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider text-primary-900 focus:outline-none"
                    >
                      <span>Fabrication & Care</span>
                      <i
                        class="bi text-sm transition-transform duration-200"
                        [class.bi-plus]="!accordions.fabric"
                        [class.bi-dash]="accordions.fabric"
                      ></i>
                    </button>
                    <div
                      *ngIf="accordions.fabric"
                      class="mt-3 text-xs text-gray-500 leading-relaxed animate-fade-in"
                    >
                      Made with a premium blend of 70% baby alpaca and 30%
                      extrafine virgin wool. Dry clean only. Handle with care.
                    </div>
                  </div>

                  <!-- Shipping & Returns -->
                  <div class="border-b border-gray-100 py-4">
                    <button
                      (click)="toggleAccordion('shipping')"
                      class="w-full flex justify-between items-center text-xs font-bold uppercase tracking-wider text-primary-900 focus:outline-none"
                    >
                      <span>Shipping & Returns</span>
                      <i
                        class="bi text-sm transition-transform duration-200"
                        [class.bi-plus]="!accordions.shipping"
                        [class.bi-dash]="accordions.shipping"
                      ></i>
                    </button>
                    <div
                      *ngIf="accordions.shipping"
                      class="mt-3 text-xs text-gray-500 leading-relaxed animate-fade-in"
                    >
                      Complimentary standard shipping on orders over INR 8,000.
                      Returns are accepted within 14 days of purchase in
                      original unworn condition.
                    </div>
                  </div>
                </div>

                <!-- SKU & Tags metadata -->
                <div
                  class="mt-8 space-y-2 text-[10px] font-bold tracking-wider uppercase text-gray-400"
                >
                  <div class="flex gap-2">
                    <span class="w-16">SKU:</span>
                    <span class="text-primary-900">{{
                      (selectedVariant$ | async)?.sku ||
                        product.variants[0]?.sku
                    }}</span>
                  </div>
                  <div
                    class="flex gap-2"
                    *ngIf="product.tags && product.tags.length"
                  >
                    <span class="w-16">Tags:</span>
                    <span class="text-primary-900">{{
                      product.tags.join(", ")
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Marketing Highlights Section (3 Columns) -->
          <div
            class="border-t border-b border-gray-100 py-16 my-20 grid grid-cols-1 md:grid-cols-3 gap-12 text-left"
          >
            <div>
              <span
                class="text-[9px] font-bold text-gray-400 tracking-widest uppercase block mb-3"
                >Design</span
              >
              <h4 class="text-sm font-bold text-primary-900 mb-2">Airy & Warm</h4>
              <p class="text-xs text-gray-500 leading-relaxed">
                This piece features a bold cable knit design, structured mock
                neck, and functional side slits, perfect for versatile layering
                with your wardrobe staples.
              </p>
            </div>
            <div>
              <span
                class="text-[9px] font-bold text-gray-400 tracking-widest uppercase block mb-3"
                >Quality</span
              >
              <h4 class="text-sm font-bold text-primary-900 mb-2">
                Made in Italy
              </h4>
              <p class="text-xs text-gray-500 leading-relaxed">
                Fashioned by an Italian mill dedicated to renewable fibers,
                following sustainable environmental and social standards for a
                premium finish.
              </p>
            </div>
            <div>
              <span
                class="text-[9px] font-bold text-gray-400 tracking-widest uppercase block mb-3"
                >Sustainability</span
              >
              <h4 class="text-sm font-bold text-primary-900 mb-2">
                Sustainable Baby Alpaca
              </h4>
              <p class="text-xs text-gray-500 leading-relaxed">
                Made using highest quality Baby Alpaca from Peru (certified
                mulesing free) and blended with recycled polyamide for
                durability.
              </p>
            </div>
          </div>

          <!-- Customer Reviews Section -->
          <div
            class="max-w-5xl mx-auto px-4 my-20 border-t border-gray-100 pt-20"
          >
            <h3
              class="text-2xl font-black text-primary-900 tracking-tight text-left mb-12"
            >
              Customer Experiences
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <!-- Review score column -->
              <div class="lg:col-span-4 text-left space-y-6">
                <div *ngIf="reviews$ | async as reviews" class="space-y-2">
                  <app-review-summary-card
                    [rating]="getAverageRating(reviews)"
                    [reviewCount]="reviews.length"
                    [summaryText]="
                      'Based on ' + reviews.length + ' customer reviews'
                    "
                  ></app-review-summary-card>
                </div>

                <button
                  (click)="showReviewForm = !showReviewForm"
                  class="w-full py-3.5 text-xs font-bold uppercase tracking-widest border border-black hover:bg-primary-900 hover:text-white transition-all rounded-md focus:outline-none"
                >
                  {{ showReviewForm ? "Cancel Review" : "Write a Review" }}
                </button>

                <!-- Write Review Form Card -->
                <div
                  *ngIf="showReviewForm"
                  class="bg-gray-50 p-6 rounded-xl border border-gray-100 animate-fade-in mt-4"
                >
                  <h4
                    class="text-xs font-bold text-primary-900 uppercase tracking-widest mb-4"
                  >
                    Submit Your Review
                  </h4>
                  <form
                    (ngSubmit)="submitReview()"
                    #reviewForm="ngForm"
                    class="space-y-4"
                  >
                    <div>
                      <label
                        class="block text-[9px] font-bold uppercase text-gray-400 mb-1"
                        >Your Name</label
                      >
                      <input
                        type="text"
                        [(ngModel)]="newReview.customerName"
                        name="customerName"
                        required
                        class="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black font-semibold"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-[9px] font-bold uppercase text-gray-400 mb-1"
                        >Rating</label
                      >
                      <select
                        [(ngModel)]="newReview.rating"
                        name="rating"
                        class="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black font-semibold"
                      >
                        <option [value]="5">5 Stars - Excellent</option>
                        <option [value]="4">4 Stars - Very Good</option>
                        <option [value]="3">3 Stars - Average</option>
                        <option [value]="2">2 Stars - Poor</option>
                        <option [value]="1">1 Star - Terrible</option>
                      </select>
                    </div>
                    <div>
                      <label
                        class="block text-[9px] font-bold uppercase text-gray-400 mb-1"
                        >Review</label
                      >
                      <textarea
                        [(ngModel)]="newReview.comment"
                        name="comment"
                        rows="3"
                        required
                        class="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black resize-none"
                        placeholder="Tell us what you loved..."
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      [disabled]="!reviewForm.form.valid"
                      class="w-full py-3 text-xs font-bold uppercase tracking-wider bg-primary-900 text-white rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>

              <!-- Reviews List with dynamic pagination -->
              <div class="lg:col-span-8 text-left">
                <ng-container *ngIf="reviews$ | async as reviews">
                  <div
                    *ngIf="reviews.length === 0"
                    class="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200"
                  >
                    <i
                      class="bi bi-chat-square-quote text-3xl text-primary-300 mb-2 inline-block"
                    ></i>
                    <p class="text-sm font-semibold text-primary-900">
                      Be the first to review
                    </p>
                    <p class="text-xs text-gray-400">
                      Your feedback helps others make better choices.
                    </p>
                  </div>

                  <div class="divide-y divide-gray-100">
                    <div
                      *ngFor="
                        let review of reviews
                          | slice
                            : (reviewsCurrentPage - 1) * reviewsPageSize
                            : reviewsCurrentPage * reviewsPageSize
                      "
                      class="py-6 first:pt-0"
                    >
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <h5 class="text-sm font-bold text-primary-900">
                            {{ review.customerName }}
                          </h5>
                          <span
                            class="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase text-gray-400 tracking-wider mt-0.5"
                          >
                            <i
                              class="bi bi-patch-check-fill text-green-600 text-xs"
                            ></i>
                            Verified Buyer
                          </span>
                        </div>
                        <span class="text-xs font-medium text-gray-400">{{
                          review.createdAt | date: "mediumDate"
                        }}</span>
                      </div>
                      <div class="flex gap-0.5 text-yellow-400 text-xs mb-3">
                        <i
                          class="bi bi-star-fill"
                          *ngFor="let _ of [1, 2, 3, 4, 5]; let idx = index"
                          [class.text-yellow-400]="idx < review.rating"
                          [class.text-gray-200]="idx >= review.rating"
                        ></i>
                      </div>
                      <p class="text-xs text-gray-600 leading-relaxed">
                        {{ review.comment }}
                      </p>
                    </div>
                  </div>

                  <!-- Pagination Links -->
                  <div
                    *ngIf="reviews.length > reviewsPageSize"
                    class="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-gray-100"
                  >
                    <button
                      (click)="
                        setReviewsPage(
                          reviewsCurrentPage - 1,
                          Math.ceil(reviews.length / reviewsPageSize)
                        )
                      "
                      [disabled]="reviewsCurrentPage === 1"
                      class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-black disabled:opacity-40 disabled:hover:border-gray-200 transition-colors focus:outline-none"
                    >
                      <i class="bi bi-chevron-left text-xs"></i>
                    </button>

                    <button
                      *ngFor="let page of getPagesArray(reviews.length)"
                      (click)="
                        setReviewsPage(
                          page,
                          Math.ceil(reviews.length / reviewsPageSize)
                        )
                      "
                      class="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors focus:outline-none"
                      [class.bg-primary-900]="reviewsCurrentPage === page"
                      [class.text-white]="reviewsCurrentPage === page"
                      [class.text-gray-600]="reviewsCurrentPage !== page"
                      [class.hover:bg-gray-100]="reviewsCurrentPage !== page"
                    >
                      {{ page }}
                    </button>

                    <button
                      (click)="
                        setReviewsPage(
                          reviewsCurrentPage + 1,
                          Math.ceil(reviews.length / reviewsPageSize)
                        )
                      "
                      [disabled]="
                        reviewsCurrentPage ===
                        Math.ceil(reviews.length / reviewsPageSize)
                      "
                      class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-black disabled:opacity-40 disabled:hover:border-gray-200 transition-colors focus:outline-none"
                    >
                      <i class="bi bi-chevron-right text-xs"></i>
                    </button>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>

          <!-- Style With Section (Dynamically Loaded Related Category Products) -->
          <div
            *ngIf="relatedProducts$ | async as related"
            class="max-w-5xl mx-auto px-4 my-20 border-t border-gray-100 pt-20 text-left"
          >
            <ng-container *ngIf="related.length > 0">
              <h3 class="text-xl font-black text-primary-900 mb-8 tracking-tight">
                Style With
              </h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div
                  *ngFor="let product of related"
                  class="group relative flex flex-col cursor-pointer"
                >
                  <a
                    [routerLink]="routePrefix.concat(['products', product.id])"
                    class="block flex-grow flex flex-col"
                  >
                    <!-- Card Image container -->
                    <div
                      class="relative aspect-[3/4] bg-[#f8f9ff] overflow-hidden mb-4 rounded-xl"
                    >
                      <img
                        [src]="
                          (product.images && product.images[0]
                            | optimizeImage: 'card') || '/Cloth_placeholder.png'
                        "
                        class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        loading="lazy"
                      />

                      <!-- Wishlist Toggle -->
                      <button
                        (click)="toggleFavorite($event, product.id)"
                        class="absolute top-3 right-3 text-primary-900 hover:text-red-500 transition-colors z-10 focus:outline-none"
                      >
                        <i
                          class="bi text-base"
                          [class.bi-heart]="!isFavorited(product.id)"
                          [class.bi-heart-fill]="isFavorited(product.id)"
                          [class.text-red-500]="isFavorited(product.id)"
                        ></i>
                      </button>

                      <!-- Quick Add Button -->
                      <button
                        *ngIf="cartEnabled"
                        (click)="quickAdd($event, product)"
                        class="absolute bottom-3 right-3 w-8 h-8 bg-white text-primary-900 rounded-full flex items-center justify-center hover:bg-primary-900 hover:text-white transition-all shadow-sm z-10 focus:outline-none"
                        [disabled]="
                          isLoadingMap[product.id] || isOutOfStock(product)
                        "
                      >
                        <i
                          *ngIf="!isLoadingMap[product.id]"
                          class="bi bi-plus text-lg"
                        ></i>
                        <span
                          *ngIf="isLoadingMap[product.id]"
                          class="w-4.5 h-4.5 border-2 border-primary-300 border-t-primary-900 rounded-full animate-spin"
                        ></span>
                      </button>

                      <!-- Color Swatches Overlay on Hover -->
                      <div
                        *ngIf="hasColors(product)"
                        class="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-3.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 flex flex-col gap-1 border-t border-gray-100"
                      >
                        <span
                          class="text-[9px] font-bold text-primary-900 uppercase tracking-widest"
                          >Colors</span
                        >
                        <div class="flex flex-wrap gap-1">
                          <span
                            *ngFor="let variant of getUniqueColors(product)"
                            [style.background-color]="
                              getColorHex(variant.color)
                            "
                            class="w-3.5 h-3.5 rounded-full border border-gray-200 block shadow-inner"
                            [title]="variant.color"
                          ></span>
                        </div>
                      </div>
                    </div>

                    <h4
                      class="text-xs font-semibold text-primary-900 leading-tight group-hover:underline"
                    >
                      {{ product.name }}
                    </h4>
                    <p class="text-xs text-gray-500 font-semibold mt-1">
                      {{ product.variants[0]?.price | currency: "INR" }}
                    </p>
                  </a>
                </div>
              </div>
            </ng-container>
          </div>

          <!-- Recently Viewed Section -->
          <div
            *ngIf="recentlyViewed$ | async as recently"
            class="max-w-5xl mx-auto px-4 my-20 border-t border-gray-100 pt-20 text-left"
          >
            <div *ngIf="recently.length > 0">
              <h3 class="text-xl font-black text-primary-900 mb-8 tracking-tight">
                Recently viewed
              </h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div
                  *ngFor="let product of recently"
                  class="group relative flex flex-col cursor-pointer"
                >
                  <a
                    [routerLink]="routePrefix.concat(['products', product.id])"
                    class="block flex-grow flex flex-col"
                  >
                    <div
                      class="relative aspect-[3/4] bg-[#f8f9ff] overflow-hidden mb-4 rounded-xl"
                    >
                      <img
                        [src]="
                          (product.images && product.images[0]
                            | optimizeImage: 'card') || '/Cloth_placeholder.png'
                        "
                        class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        loading="lazy"
                      />

                      <!-- Wishlist Toggle -->
                      <button
                        (click)="toggleFavorite($event, product.id)"
                        class="absolute top-3 right-3 text-primary-900 hover:text-red-500 transition-colors z-10 focus:outline-none"
                      >
                        <i
                          class="bi text-base"
                          [class.bi-heart]="!isFavorited(product.id)"
                          [class.bi-heart-fill]="isFavorited(product.id)"
                          [class.text-red-500]="isFavorited(product.id)"
                        ></i>
                      </button>

                      <!-- Quick Add Button -->
                      <button
                        *ngIf="cartEnabled"
                        (click)="quickAdd($event, product)"
                        class="absolute bottom-3 right-3 w-8 h-8 bg-white text-primary-900 rounded-full flex items-center justify-center hover:bg-primary-900 hover:text-white transition-all shadow-sm z-10 focus:outline-none"
                        [disabled]="
                          isLoadingMap[product.id] || isOutOfStock(product)
                        "
                      >
                        <i
                          *ngIf="!isLoadingMap[product.id]"
                          class="bi bi-plus text-lg"
                        ></i>
                        <span
                          *ngIf="isLoadingMap[product.id]"
                          class="w-4.5 h-4.5 border-2 border-primary-300 border-t-primary-900 rounded-full animate-spin"
                        ></span>
                      </button>

                      <!-- Color Swatches Overlay on Hover -->
                      <div
                        *ngIf="hasColors(product)"
                        class="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-3.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 flex flex-col gap-1 border-t border-gray-100"
                      >
                        <span
                          class="text-[9px] font-bold text-primary-900 uppercase tracking-widest"
                          >Colors</span
                        >
                        <div class="flex flex-wrap gap-1">
                          <span
                            *ngFor="let variant of getUniqueColors(product)"
                            [style.background-color]="
                              getColorHex(variant.color)
                            "
                            class="w-3.5 h-3.5 rounded-full border border-gray-200 block shadow-inner"
                            [title]="variant.color"
                          ></span>
                        </div>
                      </div>
                    </div>

                    <h4
                      class="text-xs font-semibold text-primary-900 leading-tight group-hover:underline"
                    >
                      {{ product.name }}
                    </h4>
                    <p class="text-xs text-gray-500 font-semibold mt-1">
                      {{ product.variants[0]?.price | currency: "INR" }}
                    </p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <ng-template #loading>
          <div class="h-[60vh] flex flex-col items-center justify-center">
            <app-ui-loading size="lg"></app-ui-loading>
            <p
              class="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse mt-6"
            >
              Loading Product Details...
            </p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
})
export class WebsiteProductDetailComponent implements OnInit {
  product$: Observable<Product>;
  selectedImage$ = new BehaviorSubject<string>("");
  selectedVariant$ = new BehaviorSubject<ProductVariant | null>(null);

  selectedColor: string | null = null;
  selectedSize: string | null = null;
  quantity = 1;
  Math = Math;
  isAdding = false;

  currentMobileSlide = 0;
  showReviewForm = false;
  isLoadingMap: { [key: string]: boolean } = {};
  favoritedProducts: Set<string> = new Set();

  accordions = {
    availability: false,
    fit: false,
    fabric: false,
    shipping: false,
  };

  relatedProducts$: Observable<Product[]>;
  recentlyViewed$: Observable<Product[]>;

  reviews$: Observable<any[]> = new BehaviorSubject([]);
  reviewsCurrentPage = 1;
  reviewsPageSize = 4;

  newReview = {
    customerName: "",
    rating: 5,
    comment: "",
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private websiteService: WebsiteService,
    private cartService: CartService,
    private tenantService: TenantService,
    private authService: AuthService,
    private shopContextService: ShopContextService,
    private toastService: ToastService,
    private optimizeImagePipe: OptimizeImagePipe,
  ) {
    this.product$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get("id");
        if (!id) throw new Error("Product ID not found");
        this.loadReviews(id);
        return this.websiteService.getProduct(id);
      }),
      tap((product) => {
        if (product.images?.length) {
          this.selectedImage$.next(product.images[0]);
        }
        if (product.variants?.length) {
          this.selectedVariant$.next(product.variants[0]);
          if (product.variants[0].color)
            this.selectedColor = product.variants[0].color;
          if (product.variants[0].size)
            this.selectedSize = product.variants[0].size;

          setTimeout(() => {
            product.variants.forEach((variant) => {
              if (variant.images?.length) {
                variant.images.forEach((img) => {
                  const preloader = new Image();
                  preloader.src = this.optimizeImagePipe.transform(img, "zoom");
                  const thumbPreloader = new Image();
                  thumbPreloader.src = this.optimizeImagePipe.transform(
                    img,
                    "card",
                  );
                });
              }
            });
          }, 100);
        }
        this.saveToRecentlyViewed(product.id);
      }),
      shareReplay(1),
    );

    this.relatedProducts$ = this.product$.pipe(
      switchMap((product) => {
        return this.websiteService.getProducts({}).pipe(
          map((allProducts) => {
            const collection = this.getProductCollection(product);

            let suggestions = allProducts.filter(
              (p) =>
                p.id !== product.id &&
                collection &&
                this.matchesCollection(p, collection),
            );

            if (suggestions.length < 3) {
              const categoryMatch = allProducts.filter(
                (p) =>
                  p.id !== product.id &&
                  p.category === product.category &&
                  !suggestions.some((s) => s.id === p.id),
              );
              suggestions = [...suggestions, ...categoryMatch];
            }

            return suggestions.slice(0, 3);
          }),
        );
      }),
    );

    this.recentlyViewed$ = this.product$.pipe(
      tap((product) => this.saveToRecentlyViewed(product.id)),
      switchMap(() => {
        const ids = this.getRecentlyViewedIds();
        const currentId = this.route.snapshot.paramMap.get("id");
        return this.websiteService
          .getProducts()
          .pipe(
            map((products) =>
              products
                .filter((p) => ids.includes(p.id) && p.id !== currentId)
                .slice(0, 3),
            ),
          );
      }),
    );
  }

  get routePrefix(): string[] {
    const slug = this.tenantService.getPathSlug();
    return slug ? ["/shop", slug] : ["/"];
  }

  get cartEnabled(): boolean {
    return this.shopContextService.isCartEnabled();
  }

  ngOnInit() {
    if (typeof window !== "undefined") {
      const storedFavorites = localStorage.getItem("favorited_products");
      if (storedFavorites) {
        try {
          const parsed = JSON.parse(storedFavorites);
          if (Array.isArray(parsed)) {
            this.favoritedProducts = new Set(parsed);
          }
        } catch (e) {}
      }
    }
  }

  isWholesaleCustomer(): boolean {
    const profile = this.authService.currentUserValue;
    return (
      !!profile?.tags?.includes("wholesale") || profile?.role === "wholesale"
    );
  }

  hasColors(product: Product): boolean {
    return product.variants?.some((v) => !!v.color) ?? false;
  }

  hasSizes(product: Product): boolean {
    return product.variants?.some((v) => !!v.size) ?? false;
  }

  getUniqueColors(product: Product): ProductVariant[] {
    const colors = new Set();
    return product.variants.filter((v) => {
      if (v.color && !colors.has(v.color)) {
        colors.add(v.color);
        return true;
      }
      return false;
    });
  }

  getAvailableSizes(product: Product): ProductVariant[] {
    let variants = product.variants;
    if (this.selectedColor) {
      variants = variants.filter((v) => v.color === this.selectedColor);
    }
    const sizes = new Set();
    return variants.filter((v) => {
      if (v.size && !sizes.has(v.size)) {
        sizes.add(v.size);
        return true;
      }
      return false;
    });
  }

  selectColor(color: string) {
    this.selectedColor = color;
    this.selectedSize = null;
    this.updateSelectedVariant();
  }

  selectSize(size: string) {
    this.selectedSize = size;
    this.updateSelectedVariant();
  }

  isSizeAvailable(product: Product, size: string): boolean {
    let variants = product.variants.filter((v) => v.size === size);
    if (this.selectedColor) {
      variants = variants.filter((v) => v.color === this.selectedColor);
    }
    return variants.some((v) => (v.stock || 0) > 0);
  }

  isColorAvailable(product: Product, color: string): boolean {
    let variants = product.variants.filter((v) => v.color === color);
    return variants.some((v) => (v.stock || 0) > 0);
  }

  getMaxStock(product: Product): number {
    const variant = this.selectedVariant$.value;
    if (variant) {
      return Math.max(0, variant.stock ?? 0);
    }
    if (product.variants && product.variants.length > 0) {
      return Math.max(
        0,
        product.variants.reduce((total, v) => total + (v.stock ?? 0), 0),
      );
    }
    return 0;
  }

  isOutOfStock(product: Product): boolean {
    return this.getMaxStock(product) <= 0;
  }

  incrementQuantity(product: Product) {
    const maxStock = this.getMaxStock(product);
    if (this.quantity < maxStock) {
      this.quantity++;
    } else {
      this.toastService.showWarning(
        `Only ${maxStock} items available in stock.`,
      );
    }
  }

  updateSelectedVariant() {
    this.product$
      .pipe(
        take(1),
        tap((product) => {
          let found = product.variants.find(
            (v) =>
              (!this.selectedColor || v.color === this.selectedColor) &&
              (!this.selectedSize || v.size === this.selectedSize),
          );
          if (found) {
            this.selectedVariant$.next(found);
            this.currentMobileSlide = 0;
          }
          const maxStock = this.getMaxStock(product);
          if (this.quantity > maxStock) {
            this.quantity = Math.max(1, maxStock);
          }
        }),
      )
      .subscribe();
  }

  isValidSelection(product: Product): boolean {
    if (this.hasColors(product) && !this.selectedColor) return false;
    if (this.hasSizes(product) && !this.selectedSize) return false;
    return true;
  }

  addToCart(product: Product) {
    const maxStock = this.getMaxStock(product);
    if (maxStock <= 0) {
      this.toastService.showError("This product is currently out of stock.");
      return;
    }
    if (this.quantity > maxStock) {
      this.quantity = maxStock;
      this.toastService.showError(
        `Cannot add more than ${maxStock} items (available stock limit).`,
      );
      return;
    }

    this.isAdding = true;
    setTimeout(() => {
      const variant = this.selectedVariant$.value || product.variants[0];
      if (this.isWholesaleCustomer()) {
        const minQty =
          variant.wholesaleMinQty || product.variants[0]?.wholesaleMinQty || 1;
        if (this.quantity < minQty) {
          this.toastService.showError(
            `Wholesale orders require a minimum of ${minQty} units.`,
          );
          this.isAdding = false;
          return;
        }
      }
      this.cartService.addToCart(product, this.quantity, variant);
      this.toastService.showSuccess("Added to bag");
      this.isAdding = false;
    }, 400);
  }

  getStackedImages(product: Product): string[] {
    const variant = this.selectedVariant$.value;
    const baseImages =
      variant?.images && variant.images.length > 0
        ? variant.images
        : product.images || [];
    const imgs = [...baseImages];
    if (imgs.length === 0) {
      imgs.push("/Cloth_placeholder.png");
    }
    return imgs;
  }

  onMobileScroll(event: Event) {
    const target = event.target as HTMLElement;
    const slideWidth = target.clientWidth;
    this.currentMobileSlide = Math.round(target.scrollLeft / slideWidth);
  }

  quickAdd(event: Event, product: Product) {
    event.stopPropagation();
    event.preventDefault();
    const maxStock = this.getMaxStock(product);
    if (maxStock <= 0) {
      this.toastService.showError("This item is out of stock.");
      return;
    }
    if (product.variants && product.variants.length > 0) {
      this.isLoadingMap[product.id] = true;
      setTimeout(() => {
        this.cartService.addToCart(product, 1, product.variants[0]);
        this.toastService.showSuccess("Added to bag");
        this.isLoadingMap[product.id] = false;
      }, 400);
    }
  }

  toggleAccordion(key: "availability" | "fit" | "fabric" | "shipping") {
    this.accordions[key] = !this.accordions[key];
  }

  getColorHex(color?: string): string {
    if (!color) return "#ccc";
    const colorMap: { [key: string]: string } = {
      black: "#000000",
      white: "#ffffff",
      gray: "#808080",
      grey: "#808080",
      beige: "#f5f5dc",
      blue: "#0000ff",
      navy: "#000080",
      red: "#ff0000",
      green: "#008000",
      brown: "#a52a2a",
      yellow: "#ffff00",
      pink: "#ffc0cb",
      purple: "#800080",
      orange: "#ffa500",
      cream: "#fffdd0",
      tan: "#d2b48c",
      sand: "#c2b280",
    };
    return colorMap[color.toLowerCase()] || color;
  }

  saveToRecentlyViewed(id: string) {
    if (typeof window === "undefined") return;
    let ids = this.getRecentlyViewedIds();
    ids = ids.filter((x) => x !== id);
    ids.unshift(id);
    if (ids.length > 10) ids = ids.slice(0, 10);
    localStorage.setItem("recently_viewed_products", JSON.stringify(ids));
  }

  getRecentlyViewedIds(): string[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("recently_viewed_products");
    return stored ? JSON.parse(stored) : [];
  }

  isFavorited(productId: string): boolean {
    const user = this.authService.currentUserValue;
    if (user && user.wishlist) {
      return user.wishlist.includes(productId);
    }
    return this.favoritedProducts.has(productId);
  }

  async toggleFavorite(event: Event, productId: string) {
    event.stopPropagation();
    event.preventDefault();

    const user = this.authService.currentUserValue;
    if (user) {
      let currentWishlist = user.wishlist || [];
      if (currentWishlist.includes(productId)) {
        currentWishlist = currentWishlist.filter((id) => id !== productId);
        this.toastService.showSuccess("Removed from wishlist");
      } else {
        currentWishlist.push(productId);
        this.toastService.showSuccess("Added to wishlist");
      }

      this.authService.updateProfile({ ...user, wishlist: currentWishlist });

      try {
        await this.authService.updateUserProfile(user.uid, {
          wishlist: currentWishlist,
        });
      } catch (err) {
        console.error("Failed to update wishlist", err);
      }
    } else {
      if (this.favoritedProducts.has(productId)) {
        this.favoritedProducts.delete(productId);
        this.toastService.showSuccess("Removed from wishlist");
      } else {
        this.favoritedProducts.add(productId);
        this.toastService.showSuccess("Added to wishlist");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "favorited_products",
          JSON.stringify(Array.from(this.favoritedProducts)),
        );
      }
    }
  }

  getAverageRating(reviews: any[]): number {
    if (!reviews || reviews.length === 0) return 4.8;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }

  loadReviews(productId: string) {
    this.reviews$ = this.websiteService.getReviews(productId);
  }

  submitReview() {
    const productId = this.route.snapshot.paramMap.get("id");
    if (!productId) return;

    const currentUser = this.authService.currentUserValue;
    const reviewData = {
      productId,
      customerName: this.newReview.customerName,
      rating: Number(this.newReview.rating),
      comment: this.newReview.comment,
      customerId: currentUser?.uid || "guest",
    };

    this.websiteService.addReview(reviewData).subscribe({
      next: () => {
        this.toastService.showSuccess(
          "Review submitted successfully! It will be visible after approval.",
        );
        this.newReview = { customerName: "", rating: 5, comment: "" };
        this.showReviewForm = false;
        this.loadReviews(productId);
      },
      error: (err) => {
        console.error(err);
        const errorMsg =
          err?.error?.error?.message ||
          err?.error?.message ||
          "Failed to submit review.";
        this.toastService.showError(errorMsg);
      },
    });
  }

  setReviewsPage(page: number, maxPage: number) {
    if (page >= 1 && page <= maxPage) {
      this.reviewsCurrentPage = page;
    }
  }

  getPagesArray(totalCount: number): number[] {
    const pagesCount = Math.ceil(totalCount / this.reviewsPageSize);
    return Array.from({ length: pagesCount }, (_, i) => i + 1);
  }

  getProductCollection(product: Product): string | null {
    const collections = [
      "Party and events",
      "Office looks",
      "Selection",
      "Online Exclusive",
      "Knitwear",
      "Total Look",
      "Basics",
    ];
    for (const col of collections) {
      if (this.matchesCollection(product, col)) {
        return col;
      }
    }
    return null;
  }

  matchesCollection(product: Product, collectionName: string): boolean {
    if (!collectionName) return false;
    const colLower = collectionName.toLowerCase();

    if (product.tags && Array.isArray(product.tags)) {
      const hasTag = product.tags.some((t: string) => {
        const tagLower = t.toLowerCase();
        return (
          tagLower === colLower ||
          tagLower.includes(colLower) ||
          colLower.includes(tagLower)
        );
      });
      if (hasTag) return true;
    }

    const nameLower = (product.name || "").toLowerCase();
    const descLower = (product.description || "").toLowerCase();
    const subcatLower = (product.subcategory || "").toLowerCase();

    if (colLower === "party and events") {
      const keywords = [
        "party",
        "event",
        "wedding",
        "tuxedo",
        "suit",
        "dress",
        "evening",
        "jumpsuit",
        "celebration",
        "gown",
      ];
      return keywords.some(
        (kw) =>
          nameLower.includes(kw) ||
          descLower.includes(kw) ||
          subcatLower.includes(kw),
      );
    }

    if (colLower === "office looks") {
      const keywords = [
        "office",
        "work",
        "formal",
        "shirt",
        "blazer",
        "trousers",
        "pant",
        "shoes",
        "oxford",
        "derby",
        "loafers",
        "tie",
        "suit",
        "coat",
      ];
      return keywords.some(
        (kw) =>
          nameLower.includes(kw) ||
          descLower.includes(kw) ||
          subcatLower.includes(kw),
      );
    }

    if (colLower === "selection") {
      const keywords = [
        "selection",
        "featured",
        "premium",
        "luxury",
        "designer",
        "exclusive",
        "special",
        "classic",
        "signature",
      ];
      return keywords.some(
        (kw) =>
          nameLower.includes(kw) ||
          descLower.includes(kw) ||
          subcatLower.includes(kw),
      );
    }

    if (colLower === "online exclusive") {
      const keywords = ["online", "exclusive", "web-only", "limited"];
      return keywords.some(
        (kw) =>
          nameLower.includes(kw) ||
          descLower.includes(kw) ||
          subcatLower.includes(kw),
      );
    }

    if (colLower === "knitwear") {
      const keywords = [
        "knitwear",
        "knit",
        "sweater",
        "cardigan",
        "pullover",
        "woolen",
        "hoodie",
        "jacket",
        "winter",
      ];
      return keywords.some(
        (kw) =>
          nameLower.includes(kw) ||
          descLower.includes(kw) ||
          subcatLower.includes(kw),
      );
    }

    if (colLower === "total look") {
      const keywords = [
        "total look",
        "co-ord",
        "set",
        "suit",
        "combo",
        "tracksuit",
        "outfit",
      ];
      return keywords.some(
        (kw) =>
          nameLower.includes(kw) ||
          descLower.includes(kw) ||
          subcatLower.includes(kw),
      );
    }

    if (colLower === "basics") {
      const keywords = [
        "basic",
        "t-shirt",
        "tshirt",
        "tee",
        "jeans",
        "denim",
        "polo",
        "casual",
        "everyday",
      ];
      return keywords.some(
        (kw) =>
          nameLower.includes(kw) ||
          descLower.includes(kw) ||
          subcatLower.includes(kw),
      );
    }

    return false;
  }
}
