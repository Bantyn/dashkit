import { Pipe, PipeTransform, inject } from '@angular/core';
import { ShopContextService } from '../../core/services/shop-context.service';

export interface ImageTransformationConfig {
  enableBackgroundRemoval: boolean;
  defaultQuality: string;
}

const GLOBAL_IMAGE_CONFIG: ImageTransformationConfig = {
  // Currently disabled to reduce Cloudinary transformation costs.
  // Can be toggled on in the future via config or feature flags.
  enableBackgroundRemoval: false,
  // q_auto provides the optimal balance of quality and file size for production.
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

@Pipe({
  name: 'optimizeImage',
  standalone: true
})
export class OptimizeImagePipe implements PipeTransform {
  private shopContext = inject(ShopContextService, { optional: true });

  transform(url: string | null | undefined, profileOrWidth?: ImageProfile | number | string, skipBgRemoval: boolean = false): string {
    if (!url) return '/Cloth_placeholder.png';
    
    // Build Cloudinary transformations
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      const transforms: string[] = [];
      
      // Feature Flagged Background Removal
      if (GLOBAL_IMAGE_CONFIG.enableBackgroundRemoval && !skipBgRemoval && !url.includes('e_background_removal')) {
        transforms.push('e_background_removal');
      }
      
      // Ensure optimized quality and auto format (WebP/AVIF depending on browser support)
      if (!url.includes('q_auto')) {
        transforms.push(GLOBAL_IMAGE_CONFIG.defaultQuality, 'f_auto');
      }

      // Determine width based on profile name or fallback numeric width
      let targetWidth: number | undefined;
      if (typeof profileOrWidth === 'string' && PROFILE_WIDTHS[profileOrWidth as ImageProfile]) {
        targetWidth = PROFILE_WIDTHS[profileOrWidth as ImageProfile];
      } else if (profileOrWidth && !isNaN(Number(profileOrWidth))) {
        targetWidth = Number(profileOrWidth);
      }

      // If width is provided in the pipe, apply responsive resizing
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
