import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { radius } from "../theme";
import { useTheme } from "../ThemeContext";

export function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    chip: {
      backgroundColor: colors.surfaceMuted,
    },
    chipActive: {
      backgroundColor: colors.brandStrong
    },
    text: {
      color: colors.textSecondary,
    },
    textActive: {
      color: colors.white
    }
  });

  return (
    <Pressable style={[styles.chip, dynamicStyles.chip, active && dynamicStyles.chipActive]}>
      <Text style={[styles.text, dynamicStyles.text, active && dynamicStyles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  text: {
    fontWeight: "700"
  }
});
