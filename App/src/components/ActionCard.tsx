import React from "react";
import { Pressable, StyleSheet, Text, View, DimensionValue, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";
import { getResponsiveFontSize, getPlatformPadding } from "../utils/responsive";

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
      fontSize: getResponsiveFontSize(12),
    },
    caption: {
      color: colors.textSecondary,
      fontSize: getResponsiveFontSize(10),
    },
    iconWrap: {
      backgroundColor: colors.brand + "15",
    },
  });

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card, 
        dynamicStyles.card,
        pressed && Platform.OS === "ios" && { opacity: 0.88, transform: [{ scale: 0.99 }] }
      ]}
      android_ripple={{ color: colors.brand + "20" }}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, dynamicStyles.iconWrap]}>
        <Ionicons name={iconName} size={20} color={colors.brand} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, dynamicStyles.title]} numberOfLines={2}>{title}</Text>
        <Text style={[styles.caption, dynamicStyles.caption]} numberOfLines={2}>{caption}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        borderRadius: radius.md,
        paddingHorizontal: 12,
        paddingVertical: 11,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
      },
      android: {
        borderRadius: radius.sm,
        paddingHorizontal: 10,
        paddingVertical: 9,
        marginBottom: 8,
        elevation: 0,
      },
      web: {
        borderRadius: radius.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 10,
        boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
      }
    }),
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: "700",
    marginBottom: 2,
    ...Platform.select({
      ios: { fontSize: 13, lineHeight: 18 },
      android: { fontSize: 11, lineHeight: 15 },
      web: { fontSize: 12, lineHeight: 16 }
    })
  },
  caption: {
    ...Platform.select({
      ios: { fontSize: 10.5, lineHeight: 14 },
      android: { fontSize: 9, lineHeight: 13 },
      web: { fontSize: 10, lineHeight: 14 }
    })
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
