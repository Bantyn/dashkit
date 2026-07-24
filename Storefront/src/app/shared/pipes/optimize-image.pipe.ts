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

@Pipe({
  name: 'optimizeImage',
  standalone: true
})
export class OptimizeImagePipe implements PipeTransform {
  private shopContext = inject(ShopContextService, { optional: true });

  transform(url: string | null | undefined, profileOrWidth?: ImageProfile | number | string, skipBgRemoval: boolean = false): string {
    if (!url) return '/Cloth_placeholder.png';
    
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
