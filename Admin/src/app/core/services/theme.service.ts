import { Injectable } from '@angular/core';

type ThemePalette = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  fontFamily: string;
  radius: string;
  backgroundColor?: string;
  textColor?: string;
};

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  applyAdminTheme(theme: ThemePalette | null | undefined) {
    if (typeof document === 'undefined' || !theme) {
      return;
    }

    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--bg-card', theme.surfaceColor);
    root.style.setProperty('--font-family-base', theme.fontFamily || 'Inter');
    root.style.setProperty('--radius-xl', theme.radius || '24px');

    if (theme.primaryColor) {
      const hex = theme.primaryColor;

      const adjustColor = (color: string, amount: number) => {
        return (
          '#' +
          color
            .replace(/^#/, '')
            .replace(/../g, (c) =>
              ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2),
            )
        );
      };

      root.style.setProperty('--color-primary-50', adjustColor(hex, 200));
      root.style.setProperty('--color-primary-100', adjustColor(hex, 160));
      root.style.setProperty('--color-primary-200', adjustColor(hex, 80));
      root.style.setProperty('--color-primary-300', adjustColor(hex, 60));
      root.style.setProperty('--color-primary-400', adjustColor(hex, 40));
      root.style.setProperty('--color-primary-500', adjustColor(hex, 20));
      root.style.setProperty('--color-primary-600', hex);
      root.style.setProperty('--color-primary-700', adjustColor(hex, -20));
      root.style.setProperty('--color-primary-800', adjustColor(hex, -40));
      root.style.setProperty('--color-primary-900', adjustColor(hex, -60));
    }
  }
}
