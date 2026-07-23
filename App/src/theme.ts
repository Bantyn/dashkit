export const lightColors = {
  background: "#F5F7FF",
  surface: "#FFFFFF",
  surfaceElevated: "#F0F2FF",
  surfaceMuted: "#E8EBFF",
  surfaceAccent: "#8E94F2", // Lavender
  border: "#E0E4F5",
  textPrimary: "#2D3142",
  textSecondary: "#9094A6",
  textMuted: "#BFC3D9",
  brand: "#8E94F2",
  brandStrong: "#7379E8",
  successBg: "#E3F9E5",
  successText: "#1DB954",
  warningBg: "#FFF4E5",
  warningText: "#FF9800",
  dangerBg: "#FFE5E5",
  dangerText: "#FF4D4D",
  white: "#ffffff",
} as const;

export const darkColors = {
  background: "#1A1C2E",
  surface: "#242745",
  surfaceElevated: "#2D3154",
  surfaceMuted: "#363B63",
  surfaceAccent: "#8E94F2",
  border: "#3D426E",
  textPrimary: "#FFFFFF",
  textSecondary: "#A5A9C2",
  textMuted: "#6B7094",
  brand: "#8E94F2",
  brandStrong: "#A5A9FF",
  successBg: "#1B3B24",
  successText: "#7EE081",
  warningBg: "#4D3819",
  warningText: "#FFC857",
  dangerBg: "#4D1F1F",
  dangerText: "#FF8585",
  white: "#ffffff",
} as const;

export const colors = lightColors;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;
