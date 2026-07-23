import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius } from "../theme";
import { useTheme } from "../ThemeContext";

export function ActionCard({
  title,
  caption,
  onPress
}: {
  title: string;
  caption: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    title: {
      color: colors.textPrimary,
    },
    caption: {
      color: colors.textSecondary,
    },
    iconWrap: {
      backgroundColor: colors.brandStrong,
    }
  });

  return (
    <Pressable style={[styles.card, dynamicStyles.card]} onPress={onPress}>
      <View style={styles.content}>
        <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>
        <Text style={[styles.caption, dynamicStyles.caption]}>{caption}</Text>
      </View>
      <View style={[styles.iconWrap, dynamicStyles.iconWrap]}>
        <Text style={styles.icon}>+</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 5
  },
  caption: {
    fontSize: 13,
    lineHeight: 18
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },
  icon: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 24
  }
});
