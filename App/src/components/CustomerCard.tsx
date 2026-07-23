import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { radius } from "../theme";
import type { Customer } from "../types";
import { useTheme } from "../ThemeContext";

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
      fontSize:17,
      textTransform: "uppercase",
    },
    name: {
      color: colors.textPrimary,
    },
    meta: {
      color: colors.textSecondary,
    },
    dueValue: {
      color: colors.textPrimary,
    },
    dueLabel: {
      color: colors.textMuted,
    }
  });

  return (
    <View style={[styles.card, dynamicStyles.card]}>
      <View style={[styles.avatar, dynamicStyles.avatar]}>
        <Text style={[styles.avatarText, dynamicStyles.avatarText]}>{customer.name.slice(0, 1)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, dynamicStyles.name]}>{customer.name}</Text>
        <Text style={[styles.meta, dynamicStyles.meta]}>
          {customer.phoneNumber} | Spent : ₹{customer.totalSpent}
        </Text>
        <Text style={[styles.meta, dynamicStyles.meta]}>
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
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800"
  },
  content: {
    flex: 1
  },
  name: {
    fontSize: 17,
    fontWeight: "700"
  },
  meta: {
    marginTop: 4
  },
  due: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 42
  },
  dueValue: {
    fontSize: 20,
    fontWeight: "800"
  },
  dueLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase"
  }
});
