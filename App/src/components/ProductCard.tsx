import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius } from "../theme";
import type { Product } from "../types";
import { useTheme } from "../ThemeContext";

export function ProductCard({ product, onEdit }: { product: Product, onEdit?: () => void }) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    name: {
      color: colors.textPrimary,
    },
    meta: {
      color: colors.textSecondary,
    },
    price: {
      color: colors.brand,
    },
    stock: {
      backgroundColor: colors.surfaceMuted,
      color: colors.textPrimary,
    },
    button: {
      backgroundColor: colors.brandStrong,
    },
    buttonText: {
      color: colors.white,
    }
  });

  return (
    <View style={[styles.card, dynamicStyles.card]}>
      <View style={styles.topRow}>
        <View style={styles.flexOne}>
          <Text style={[styles.name, dynamicStyles.name]}>{product.name}</Text>
          <Text style={[styles.meta, dynamicStyles.meta]}>
            {product.id} | {product.category}
          </Text>
        </View>
        <Text style={[styles.price, dynamicStyles.price]}>{product.price}</Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={[styles.stock, dynamicStyles.stock]}>Stock {product.stock}</Text>
        {onEdit && (
          <Pressable style={[styles.button, dynamicStyles.button]} onPress={onEdit}>
            <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Edit</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 18,
    gap: 14
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
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
    fontSize: 17,
    fontWeight: "700"
  },
  meta: {
    marginTop: 6
  },
  price: {
    fontSize: 18,
    fontWeight: "800"
  },
  stock: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
    fontWeight: "700"
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.sm
  },
  buttonText: {
    fontWeight: "700"
  }
});
