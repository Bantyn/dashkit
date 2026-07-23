import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product } from '../../core/models/product.model';
import { ApiResponse } from '../../core/models/api-response.model';
import { Shop } from '../../core/models/shop.model';

export type ImageCategory = 'shop' | 'product' | 'profile' | 'customer' | 'invoice';

export interface GalleryImage {
  url: string;
  category: ImageCategory;
  label: string;         // product name, 'Logo', 'Banner', etc.
  productId?: string;    // set when category = 'product'
  productName?: string;
  invoiceId?: string;    // set when category = 'invoice'
  fieldKey?: string;     // 'logo' | 'banner' for shop images
  uploadedAt?: Date;
  sizeBytes?: number | null;   // loaded lazily via HEAD request
}

export interface ProductImageGroup {
  productId: string;
  productName: string;
  coverImage: string;
  images: string[];
}


@Injectable({ providedIn: 'root' })
export class ImageGalleryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Upload ───────────────────────────────────────────────────────────────

  uploadImage(shopId: string, file: File): Observable<{ url: string; progress?: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ data: { url: string } }>(
        `${this.apiUrl}/shops/${shopId}/media/upload`,
        formData,
        { reportProgress: true, observe: 'events' }
      )
      .pipe(
        map((event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            return { url: '', progress: Math.round((100 * event.loaded) / event.total) };
          } else if (event.type === HttpEventType.Response) {
            return { url: event.body?.data?.url || '', progress: 100 };
          }
          return { url: '', progress: 0 };
        }),
      );
  }

  // ─── Shop Images ──────────────────────────────────────────────────────────

  getShop(shopId: string): Observable<ApiResponse<Shop>> {
    return this.http.get<ApiResponse<Shop>>(`${this.apiUrl}/shops/${shopId}`);
  }

  updateShopField(shopId: string, field: 'logo' | 'banner', url: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/shops/${shopId}`, { [field]: url });
  }

  /**
   * Update shop theme object (logo & banner live inside theme on the backend)
   * Sends { theme: { ...existingTheme, logo/banner: url } }
   */
  updateShopTheme(shopId: string, theme: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/shops/${shopId}`, { theme });
  }



  getProducts(shopId: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/products/shop/${shopId}`);
  }

  getInvoices(shopId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/invoices/shop/${shopId}`);
  }

  updateProductImages(productId: string, images: string[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${productId}`, { images });
  }

  // ─── Delete Image ─────────────────────────────────────────────────────────

  /**
   * Delete a shop image (logo / banner) by clearing the theme field.
   * Logo & Banner are stored inside shop.theme on the backend.
   * We pass theme with the field set to '' to clear it.
   */
  deleteShopImage(shopId: string, fieldKey: string, existingTheme: any = {}): Observable<any> {
    const updatedTheme = { ...existingTheme, [fieldKey]: '' };
    return this.http.put(`${this.apiUrl}/shops/${shopId}`, { theme: updatedTheme });
  }

  deleteProductImage(productId: string, imageUrl: string, allUrls: string[]): Observable<any> {
    const updated = allUrls.filter(u => u !== imageUrl);
    return this.http.put(`${this.apiUrl}/products/${productId}`, { images: updated });
  }

  /**
   * Delete media file from Cloudinary/S3 and reduce storage usage
   */
  deleteMedia(shopId: string, url: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/shops/${shopId}/media/delete`, { url });
  }

  /**
   * Delete an invoice by ID
   */
  deleteInvoice(invoiceId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/invoices/${invoiceId}`);
  }



  getAllGalleryImages(shopId: string, userProfileImage?: string): Observable<GalleryImage[]> {
    return forkJoin({
      shop: this.getShop(shopId).pipe(catchError(() => of(null))),
      products: this.getProducts(shopId).pipe(catchError(() => of(null))),
      invoices: this.getInvoices(shopId).pipe(catchError(() => of(null))),
    }).pipe(
      map(({ shop, products, invoices }) => {
        const images: GalleryImage[] = [];

        // Shop images — logo & banner live inside shop.theme on backend
        const shopData = (shop as any)?.data;
        const shopLogo = shopData?.theme?.logo || shopData?.logo;
        const shopBanner = shopData?.theme?.banner || shopData?.banner;

        if (shopLogo) {
          images.push({ url: shopLogo, category: 'shop', label: 'Logo', fieldKey: 'logo' });
        }
        if (shopBanner) {
          images.push({ url: shopBanner, category: 'shop', label: 'Banner', fieldKey: 'banner' });
        }

        // Website homepage banners/feed images
        const homepage = shopData?.theme?.homepageSettings;
        if (homepage) {
          const cb = homepage.categoryBanners;
          if (cb?.newArrivals) images.push({ url: cb.newArrivals, category: 'shop', label: 'New Arrivals Banner', fieldKey: 'homepageSettings.categoryBanners.newArrivals' });
          if (cb?.casualEdit) images.push({ url: cb.casualEdit, category: 'shop', label: 'The Casual Edit Banner', fieldKey: 'homepageSettings.categoryBanners.casualEdit' });
          if (cb?.bestSellers) images.push({ url: cb.bestSellers, category: 'shop', label: 'Best-Sellers Banner', fieldKey: 'homepageSettings.categoryBanners.bestSellers' });

          const ed = homepage.editorials;
          if (ed?.smartChic) images.push({ url: ed.smartChic, category: 'shop', label: 'The Smart Chic Editorial', fieldKey: 'homepageSettings.editorials.smartChic' });
          if (ed?.readyToGo) images.push({ url: ed.readyToGo, category: 'shop', label: 'Ready To Go Editorial', fieldKey: 'homepageSettings.editorials.readyToGo' });

          if (Array.isArray(homepage.instagramImages)) {
            homepage.instagramImages.forEach((img: string, idx: number) => {
              images.push({ url: img, category: 'shop', label: `Instagram Feed Photo #${idx + 1}`, fieldKey: `homepageSettings.instagramImages.${idx}` });
            });
          }
        }

        // Product images
        const productList: Product[] = (products as any)?.data || [];
        productList.forEach((p) => {
          (p.images || []).forEach((imgUrl) => {
            images.push({
              url: imgUrl,
              category: 'product',
              label: p.name,
              productId: p.id,
              productName: p.name,
            });
          });
        });

        // Profile image
        if (userProfileImage) {
          images.push({ url: userProfileImage, category: 'profile', label: 'My Profile' });
        }

        // Invoices
        const invoiceList: any[] = (invoices as any)?.data || [];
        invoiceList.forEach((inv) => {
          if (inv.pdfUrl) {
            images.push({
              url: inv.pdfUrl,
              category: 'invoice',
              label: `Invoice ${inv.invoiceNumber}`,
              invoiceId: inv.id,
              uploadedAt: inv.createdAt ? new Date(inv.createdAt) : undefined
            });
          }
        });

        return images;
      }),
    );
  }

  // ─── Product Image Groups ─────────────────────────────────────────────────

  getProductImageGroups(shopId: string): Observable<ProductImageGroup[]> {
    return this.getProducts(shopId).pipe(
      map((res) => {
        const products: Product[] = (res as any)?.data || [];
        return products
          .filter((p) => p.images && p.images.length > 0)
          .map((p) => ({
            productId: p.id,
            productName: p.name,
            coverImage: p.images![0],
            images: p.images!,
          }));
      }),
    );
  }
}
