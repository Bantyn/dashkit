import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { radius } from "../theme";
import type { Invoice } from "../types";
import { useTheme } from "../ThemeContext";

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    id: {
      color: colors.textMuted,
    },
    customer: {
      color: colors.textPrimary,
    },
    amount: {
      color: colors.textPrimary,
    },
    statusPaid: {
      backgroundColor: colors.successBg,
      color: colors.successText
    },
    statusPending: {
      backgroundColor: colors.warningBg,
      color: colors.warningText
    },
    statusOverdue: {
      backgroundColor: colors.dangerBg,
      color: colors.dangerText
    },
    date: {
      color: colors.textSecondary,
    }
  });

  const statusStyle =
    invoice.status === "Paid"
      ? dynamicStyles.statusPaid
      : invoice.status === "Pending"
        ? dynamicStyles.statusPending
        : dynamicStyles.statusOverdue;

  return (
    <View style={[styles.card, dynamicStyles.card]}>
      <View style={styles.topRow}>
        <View style={styles.flexOne}>
          <Text style={[styles.id, dynamicStyles.id]}>{invoice.id}</Text>
          <Text style={[styles.customer, dynamicStyles.customer]}>{invoice.customer}</Text>
        </View>
        <Text style={[styles.amount, dynamicStyles.amount]}>{invoice.amount}</Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={[styles.statusPill, statusStyle]}>{invoice.status}</Text>
        <Text style={[styles.date, dynamicStyles.date]}>{invoice.date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 18,
    gap: 12
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
  id: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6
  },
  customer: {
    fontSize: 17,
    fontWeight: "700"
  },
  amount: {
    fontSize: 18,
    fontWeight: "800"
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700"
  },
  date: {
    fontWeight: "600"
  }
});
