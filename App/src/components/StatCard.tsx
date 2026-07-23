import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { radius } from "../theme";
import { useTheme } from "../ThemeContext";

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
      borderWidth: 1,
      borderColor: colors.border
    },
    cardAccent: {
      backgroundColor: colors.surfaceAccent
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 8
    },
    value: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 8,
    }
  });

  return (
    <View style={[styles.card, accent ? dynamicStyles.cardAccent : dynamicStyles.cardDefault]}>
      <Text style={[dynamicStyles.label, accent && styles.labelAccent]}>{label}</Text>
      <Text style={[dynamicStyles.value, accent && styles.value]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 18
  },
  labelAccent: {
    color: "#dce8ff",

  },
value:{
    color: "#ffffff",
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 8,
    }
});
