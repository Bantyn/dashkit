import React from "react";
import { Pressable, StyleSheet, Text, View, Platform } from "react-native";

import { radius } from "../theme";
import type { Product } from "../types";
import { useTheme } from "../ThemeContext";
import { getResponsiveFontSize, getPlatformPadding } from "../utils/responsive";

export function ProductCard({ product, onEdit }: { product: Product, onEdit?: () => void }) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    name: {
      color: colors.textPrimary,
      fontSize: getResponsiveFontSize(15),
    },
    meta: {
      color: colors.textSecondary,
      fontSize: getResponsiveFontSize(12),
    },
    price: {
      color: colors.brand,
      fontSize: getResponsiveFontSize(15),
    },
    stock: {
      backgroundColor: colors.surfaceMuted,
      color: colors.textPrimary,
      fontSize: getResponsiveFontSize(11),
    },
    button: {
      backgroundColor: colors.brandStrong,
    },
    buttonText: {
      color: colors.white,
      fontSize: getResponsiveFontSize(12),
    }
  });

  return (
    <View style={[styles.card, dynamicStyles.card]}>
      <View style={styles.topRow}>
        <View style={styles.flexOne}>
          <Text style={[styles.name, dynamicStyles.name]} numberOfLines={1}>{product.name}</Text>
          <Text style={[styles.meta, dynamicStyles.meta]} numberOfLines={1}>
            Category: {product.category}
          </Text>
        </View>
        <Text style={[styles.price, dynamicStyles.price]}>{product.price}</Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={[styles.stock, dynamicStyles.stock]}>Stock: {product.stock}</Text>
        {onEdit && (
          <Pressable 
            style={({ pressed }) => [
              styles.button, 
              dynamicStyles.button,
              pressed && Platform.OS === "ios" && { opacity: 0.85 }
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.3)" }}
            onPress={onEdit}
          >
            <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Edit</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    gap: 10,
    ...Platform.select({
      ios: {
        borderRadius: radius.lg,
        padding: 14,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        borderRadius: radius.md,
        padding: 11,
        marginBottom: 8,
        elevation: 0,
      },
      web: {
        borderRadius: radius.lg,
        padding: 14,
        marginBottom: 10,
        boxShadow: "0px 2px 8px rgba(0,0,0,0.04)",
      }
    })
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  flexOne: {
    flex: 1
  },
  name: {
    fontWeight: "700",
    ...Platform.select({
      ios: { fontSize: 16 },
      android: { fontSize: 14 },
      web: { fontSize: 15 }
    })
  },
  meta: {
    marginTop: 4,
    ...Platform.select({
      ios: { fontSize: 12.5 },
      android: { fontSize: 11 },
      web: { fontSize: 12 }
    })
  },
  price: {
    fontWeight: "800",
    ...Platform.select({
      ios: { fontSize: 16 },
      android: { fontSize: 14 },
      web: { fontSize: 15 }
    })
  },
  stock: {
    borderRadius: radius.pill,
    overflow: "hidden",
    fontWeight: "700",
    ...Platform.select({
      ios: { fontSize: 12, paddingHorizontal: 12, paddingVertical: 6 },
      android: { fontSize: 10.5, paddingHorizontal: 9, paddingVertical: 5 },
      web: { fontSize: 11, paddingHorizontal: 10, paddingVertical: 6 }
    })
  },
  button: {
    borderRadius: radius.sm,
    ...Platform.select({
      ios: { paddingHorizontal: 16, paddingVertical: 9 },
      android: { paddingHorizontal: 12, paddingVertical: 7 },
      web: { paddingHorizontal: 14, paddingVertical: 8 }
    })
  },
  buttonText: {
    fontWeight: "700",
    ...Platform.select({
      ios: { fontSize: 13 },
      android: { fontSize: 11 },
      web: { fontSize: 12 }
    })
  }
});
