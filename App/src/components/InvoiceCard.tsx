import React from "react";
import { StyleSheet, Text, View, Platform } from "react-native";

import { radius } from "../theme";
import type { Invoice } from "../types";
import { useTheme } from "../ThemeContext";
import { getResponsiveFontSize, getPlatformPadding } from "../utils/responsive";

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    id: {
      color: colors.textMuted,
      fontSize: getResponsiveFontSize(10),
    },
    customer: {
      color: colors.textPrimary,
      fontSize: getResponsiveFontSize(14),
    },
    amount: {
      color: colors.textPrimary,
      fontSize: getResponsiveFontSize(16),
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
      fontSize: getResponsiveFontSize(11),
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
          <Text style={[styles.id, dynamicStyles.id]} numberOfLines={1}>{invoice.id}</Text>
          <Text style={[styles.customer, dynamicStyles.customer]} numberOfLines={1}>{invoice.customer}</Text>
        </View>
        <Text style={[styles.amount, dynamicStyles.amount]}>₹ {invoice.amount}</Text>
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
  id: {
    fontWeight: "500",
    marginBottom: 4,
    ...Platform.select({
      ios: { fontSize: 11 },
      android: { fontSize: 9.5 },
      web: { fontSize: 10 }
    })
  },
  customer: {
    fontWeight: "700",
    ...Platform.select({
      ios: { fontSize: 15.5 },
      android: { fontSize: 13.5 },
      web: { fontSize: 14.5 }
    })
  },
  amount: {
    fontWeight: "800",
    ...Platform.select({
      ios: { fontSize: 17 },
      android: { fontSize: 14.5 },
      web: { fontSize: 16 }
    })
  },
  statusPill: {
    borderRadius: radius.pill,
    overflow: "hidden",
    fontWeight: "700",
    ...Platform.select({
      ios: { fontSize: 12, paddingHorizontal: 12, paddingVertical: 6 },
      android: { fontSize: 10.5, paddingHorizontal: 9, paddingVertical: 4.5 },
      web: { fontSize: 11, paddingHorizontal: 10, paddingVertical: 5 }
    })
  },
  date: {
    fontWeight: "600",
    ...Platform.select({
      ios: { fontSize: 12 },
      android: { fontSize: 10.5 },
      web: { fontSize: 11 }
    })
  }
});
