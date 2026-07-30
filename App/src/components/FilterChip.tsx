import React from "react";
import { Pressable, StyleSheet, Text, Platform } from "react-native";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";
import { getResponsiveFontSize, getPlatformPadding } from "../utils/responsive";

export function FilterChip({
  label,
  active = false,
  selected,
  onPress,
}: {
  label: string;
  active?: boolean;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const isActive = selected !== undefined ? selected : active;

  const dynamicStyles = StyleSheet.create({
    chip: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderWidth: 0.5,
    },
    chipActive: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    text: {
      color: colors.textSecondary,
      fontSize: getResponsiveFontSize(12),
    },
    textActive: {
      color: colors.white,
    },
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip, 
        dynamicStyles.chip, 
        isActive && dynamicStyles.chipActive,
        pressed && Platform.OS === "ios" && { opacity: 0.8 }
      ]}
      android_ripple={{ color: colors.brand + "20" }}
      onPress={onPress}
    >
      <Text style={[styles.text, dynamicStyles.text, isActive && dynamicStyles.textActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: getPlatformPadding(14, 12),
    paddingVertical: getPlatformPadding(8, 6),
    marginRight: 6,
  },
  text: {
    fontWeight: "700",
  },
});
