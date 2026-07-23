import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../ThemeContext";

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
        { color: light ? colors.white : colors.textPrimary }
      ]}>
        {title}
      </Text>
      <Text style={[
        styles.meta,
        { color: light ? colors.white : colors.textSecondary, opacity: light ? 0.9 : 1 }
      ]}>
        {meta}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  title: {
    fontSize: 22,
    fontWeight: "800"
  },
  meta: {
    fontSize: 13,
    fontWeight: "600"
  }
});
