import React from "react";
import { StyleSheet, Text, View, Platform } from "react-native";

import { radius } from "../theme";
import type { Customer } from "../types";
import { useTheme } from "../ThemeContext";
import { getResponsiveFontSize, getPlatformPadding } from "../utils/responsive";

export function CustomerCard({ customer }: { customer: Customer }) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    avatar: {
      backgroundColor: colors.brandStrong,
    },
    avatarText: {
      color: colors.white,
      fontSize: getResponsiveFontSize(16),
      textTransform: "uppercase",
    },
    name: {
      color: colors.textPrimary,
      fontSize: getResponsiveFontSize(15),
    },
    meta: {
      color: colors.textSecondary,
      fontSize: getResponsiveFontSize(12),
    },
    dueValue: {
      color: colors.textPrimary,
      fontSize: getResponsiveFontSize(18),
    },
    dueLabel: {
      color: colors.textMuted,
      fontSize: getResponsiveFontSize(10),
    }
  });

  return (
    <View style={[styles.card, dynamicStyles.card]}>
      <View style={[styles.avatar, dynamicStyles.avatar]}>
        <Text style={[styles.avatarText, dynamicStyles.avatarText]}>{customer.name.slice(0, 1)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, dynamicStyles.name]} numberOfLines={1}>{customer.name}</Text>
        <Text style={[styles.meta, dynamicStyles.meta]} numberOfLines={1}>
          {customer.phoneNumber} | Spent: ₹{(customer.totalSpent || 0).toLocaleString()}
        </Text>
        <Text style={[styles.meta, dynamicStyles.meta]} numberOfLines={1}>
          {customer.email ? "Online Customer" : "Store Customer"}
        </Text>
      </View>
      <View style={styles.due}>
        <Text style={[styles.dueValue, dynamicStyles.dueValue]}>{customer.totalOrders}</Text>
        <Text style={[styles.dueLabel, dynamicStyles.dueLabel]}>Invoices</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...Platform.select({
      ios: {
        borderRadius: radius.lg,
        padding: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        borderRadius: radius.md,
        padding: 11,
        marginBottom: 1,
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
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { width: 44, height: 44, borderRadius: 22 },
      android: { width: 38, height: 38, borderRadius: 19 },
      web: { width: 42, height: 42, borderRadius: 21 }
    })
  },
  avatarText: {
    fontWeight: "800",
    ...Platform.select({
      ios: { fontSize: 17 },
      android: { fontSize: 14 },
      web: { fontSize: 16 }
    })
  },
  content: {
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
    marginTop: 3,
    ...Platform.select({
      ios: { fontSize: 12.5 },
      android: { fontSize: 11 },
      web: { fontSize: 12 }
    })
  },
  due: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40
  },
  dueValue: {
    fontWeight: "800",
    ...Platform.select({
      ios: { fontSize: 19 },
      android: { fontSize: 16 },
      web: { fontSize: 18 }
    })
  },
  dueLabel: {
    fontWeight: "700",
    textTransform: "uppercase",
    ...Platform.select({
      ios: { fontSize: 10.5 },
      android: { fontSize: 9.5 },
      web: { fontSize: 10 }
    })
  }
});
