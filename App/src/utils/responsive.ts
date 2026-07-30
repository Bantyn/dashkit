import { Dimensions, Platform, PixelRatio, ViewStyle, TextStyle } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base dimension scale based on standard mobile width (375pt)
const scaleBase = Math.min(SCREEN_WIDTH, 480) / 375;

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";
export const deviceWidth = SCREEN_WIDTH;
export const deviceHeight = SCREEN_HEIGHT;

export const scale = (size: number) => {
  const newSize = size * scaleBase;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const getResponsiveFontSize = (baseSize: number) => {
  const scaled = scale(baseSize);
  if (isIOS) {
    return Math.round(Math.min(scaled + 1.2, baseSize * 1.3));
  }
  return Math.round(Math.min(scaled * 0.95, baseSize * 1.15));
};

export const platformFontSize = (iosSize: number, androidSize: number) => {
  return isIOS ? scale(iosSize) : scale(androidSize);
};

export const getPlatformPadding = (iosPadding: number, androidPadding: number) => {
  return isIOS ? scale(iosPadding) : scale(androidPadding);
};

export const platformPadding = (iosPadding: number, androidPadding: number) => {
  return isIOS ? scale(iosPadding) : scale(androidPadding);
};

export const platformMargin = (iosMargin: number, androidMargin: number) => {
  return isIOS ? scale(iosMargin) : scale(androidMargin);
};

export const platformRadius = (iosRadius: number, androidRadius: number) => {
  return isIOS ? iosRadius : androidRadius;
};

export const platformBorderWidth = (iosBorder: number, androidBorder: number) => {
  return isIOS ? iosBorder : androidBorder;
};

export const platformSelect = Platform.select;

export const platformCardStyle = (options?: {
  iosRadius?: number;
  androidRadius?: number;
  iosPadding?: number;
  androidPadding?: number;
  iosMargin?: number;
  androidMargin?: number;
  elevation?: number;
}): ViewStyle => {
  const iosR = options?.iosRadius ?? 16;
  const androidR = options?.androidRadius ?? 12;
  const iosP = options?.iosPadding ?? 14;
  const androidP = options?.androidPadding ?? 10;
  const iosM = options?.iosMargin ?? 8;
  const androidM = options?.androidMargin ?? 6;

  return Platform.select({
    ios: {
      borderRadius: iosR,
      padding: scale(iosP),
      marginBottom: scale(iosM),
      borderWidth: 0.5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
    },
    android: {
      borderRadius: androidR,
      padding: scale(androidP),
      marginBottom: scale(androidM),
      borderWidth: 0.5,
      elevation: options?.elevation ?? 0,
    },
    web: {
      borderRadius: iosR,
      padding: scale(iosP),
      marginBottom: scale(iosM),
      borderWidth: 0.5,
      boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
    },
  }) as ViewStyle;
};
