import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";

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
      borderWidth: 1,
    },
    chipActive: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    text: {
      color: colors.textSecondary,
    },
    textActive: {
      color: colors.white,
    },
  });

  return (
    <Pressable
      style={[styles.chip, dynamicStyles.chip, isActive && dynamicStyles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.text, dynamicStyles.text, isActive && dynamicStyles.textActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
  },
});
