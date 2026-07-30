import React from "react";
import { StyleSheet, Text, View, Platform } from "react-native";

import { radius } from "../theme";
import { useTheme } from "../ThemeContext";
import { getResponsiveFontSize, getPlatformPadding } from "../utils/responsive";

export function StatCard({
  label,
  value,
  accent = false
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    cardDefault: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border
    },
    cardAccent: {
      backgroundColor: colors.surfaceAccent
    },
    label: {
      color: colors.textSecondary,
      fontSize: getResponsiveFontSize(11),
      fontWeight: "500",
      marginBottom: 6
    },
    value: {
      color: colors.textPrimary,
      fontSize: getResponsiveFontSize(16),
      fontWeight: "700",
      marginBottom: 4,
    }
  });

  return (
    <View style={[styles.card, accent ? dynamicStyles.cardAccent : dynamicStyles.cardDefault]}>
      <Text style={[dynamicStyles.label, accent && styles.labelAccent]} numberOfLines={1}>{label}</Text>
      <Text style={[dynamicStyles.value, accent && styles.value]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    ...Platform.select({
      ios: {
        borderRadius: radius.lg,
        padding: 13,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        borderRadius: radius.md,
        padding: 10,
        elevation: 0,
      },
      web: {
        borderRadius: radius.lg,
        padding: 12,
        boxShadow: "0px 2px 6px rgba(0,0,0,0.04)",
      }
    })
  },
  labelAccent: {
    color: "#dce8ff",
  },
  value: {
    color: "#ffffff",
  }
});
