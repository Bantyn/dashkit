import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../ThemeContext";
import { getResponsiveFontSize } from "../utils/responsive";

export function SectionHeader({
  title,
  meta,
  light = false
}: {
  title: string;
  meta: string;
  light?: boolean
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[
        styles.title,
        { color: light ? colors.white : colors.textPrimary, fontSize: getResponsiveFontSize(18) }
      ]}>
        {title}
      </Text>
      <Text style={[
        styles.meta,
        { color: light ? colors.white : colors.textSecondary, opacity: light ? 0.9 : 1, fontSize: getResponsiveFontSize(11) }
      ]}>
        {meta}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginVertical: 10,
  },
  title: {
    fontWeight: "800",
  },
  meta: {
    fontWeight: "600",
    marginTop: 2
  }
});
