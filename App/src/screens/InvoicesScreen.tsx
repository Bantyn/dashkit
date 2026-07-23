import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { FilterChip } from "../components/FilterChip";
import { InvoiceCard } from "../components/InvoiceCard";
import { SectionHeader } from "../components/SectionHeader";
import { invoices } from "../data/mockData";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";

export function InvoicesScreen() {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    highlight: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    highlightLabel: {
      color: colors.textSecondary,
    },
    highlightValue: {
      color: colors.textPrimary,
    },
    highlightText: {
      color: colors.textSecondary,
    }
  });

  return (
    <View style={styles.section}>
      <SectionHeader title="Invoice management" meta="Draft, review, collect" />

      <View style={styles.chipRow}>
        <FilterChip label="All" active />
        <FilterChip label="Paid" />
        <FilterChip label="Pending" />
        <FilterChip label="Overdue" />
      </View>

      <View style={[styles.highlight, dynamicStyles.highlight]}>
        <Text style={[styles.highlightLabel, dynamicStyles.highlightLabel]}>Collection target</Text>
        <Text style={[styles.highlightValue, dynamicStyles.highlightValue]}>Rs 1.85L</Text>
        <Text style={[styles.highlightText, dynamicStyles.highlightText]}>7 unpaid invoices need follow-up today.</Text>
      </View>

      {invoices.map((invoice) => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  highlight: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 20
  },
  highlightLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 8
  },
  highlightValue: {
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 8
  },
  highlightText: {
    fontSize: 14,
    lineHeight: 21
  }
});
