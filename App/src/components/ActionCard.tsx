import React from "react";
import { Pressable, StyleSheet, Text, View, DimensionValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";

interface ActionCardProps {
  title: string;
  caption: string;
  onPress: () => void;
  iconName?: any;
  width?: DimensionValue;
}

export function ActionCard({
  title,
  caption,
  onPress,
  iconName = "arrow-forward-circle",
  width = "100%",
}: ActionCardProps) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      width: width,
    },
    title: {
      color: colors.textPrimary,
    },
    caption: {
      color: colors.textSecondary,
    },
    iconWrap: {
      backgroundColor: colors.brand + "15",
    },
  });

  return (
    <Pressable style={[styles.card, dynamicStyles.card]} onPress={onPress}>
      <View style={[styles.iconWrap, dynamicStyles.iconWrap]}>
        <Ionicons name={iconName} size={22} color={colors.brand} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, dynamicStyles.title]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.caption, dynamicStyles.caption]} numberOfLines={2}>{caption}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
