import { Pipe, PipeTransform, inject } from '@angular/core';
import { ShopContextService } from '../../core/services/shop-context.service';

export interface ImageTransformationConfig {
  enableBackgroundRemoval: boolean;
  defaultQuality: string;
}

const GLOBAL_IMAGE_CONFIG: ImageTransformationConfig = {
  enableBackgroundRemoval: false,
  defaultQuality: 'q_auto'
};

export type ImageProfile = 'thumbnail' | 'card' | 'product' | 'zoom' | 'hero';

const PROFILE_WIDTHS: Record<ImageProfile, number> = {
  thumbnail: 150,
  card: 400,
  product: 800,
  zoom: 1200,
  hero: 1600
};

/**
 * Inline SVG placeholder — avoids HTTP 404 on subdomain tenants and
 * prevents infinite onerror loops when /Cloth_placeholder.png is missing.
 */
export const PLACEHOLDER_IMAGE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Crect x='130' y='100' width='140' height='160' rx='12' fill='%23e5e7eb'/%3E%3Cellipse cx='200' cy='95' rx='30' ry='18' fill='%23d1d5db'/%3E%3Crect x='145' y='100' width='110' height='10' rx='5' fill='%23d1d5db'/%3E%3Ctext x='200' y='300' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E`;

@Pipe({
  name: 'optimizeImage',
  standalone: true
})
export class OptimizeImagePipe implements PipeTransform {
  private shopContext = inject(ShopContextService, { optional: true });

  transform(url: string | null | undefined, profileOrWidth?: ImageProfile | number | string, skipBgRemoval: boolean = false): string {
    if (!url) return PLACEHOLDER_IMAGE;

    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      const transforms: string[] = [];

      if (GLOBAL_IMAGE_CONFIG.enableBackgroundRemoval && !skipBgRemoval && !url.includes('e_background_removal')) {
        transforms.push('e_background_removal');
      }

      if (!url.includes('q_auto')) {
        transforms.push(GLOBAL_IMAGE_CONFIG.defaultQuality, 'f_auto');
      }

      let targetWidth: number | undefined;
      if (typeof profileOrWidth === 'string' && PROFILE_WIDTHS[profileOrWidth as ImageProfile]) {
        targetWidth = PROFILE_WIDTHS[profileOrWidth as ImageProfile];
      } else if (profileOrWidth && !isNaN(Number(profileOrWidth))) {
        targetWidth = Number(profileOrWidth);
      }

      if (targetWidth && !url.includes('w_')) {
        transforms.push(`w_${targetWidth}`, 'c_limit');
      }

      if (transforms.length > 0) {
        return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
      }
    }

    return url;
  }
}
