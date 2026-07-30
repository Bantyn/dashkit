import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, RefreshControl, Platform } from "react-native";

import { CustomerCard } from "../components/CustomerCard";
import { SectionHeader } from "../components/SectionHeader";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";
import { getCustomersByShop } from "../api";

export function CustomersScreen({ user, refreshSignal, onRefreshComplete }: { user: any, refreshSignal?: number, onRefreshComplete?: () => void }) {
  const { colors } = useTheme();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCustomers(false);
  }, []);

  useEffect(() => {
    if (refreshSignal && refreshSignal > 0) {
        fetchCustomers(true);
    }
  }, [refreshSignal]);

  const fetchCustomers = async (force = false) => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const response = await getCustomersByShop(user.shopId, force);
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error("Fetch customers error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (onRefreshComplete) onRefreshComplete();
    }
  };

  const dynamicStyles = StyleSheet.create({
    highlight: {
      backgroundColor: colors.surfaceMuted,
    },
    highlightLabel: {
      color: colors.textSecondary,
    },
    highlightText: {
      color: colors.textPrimary,
    }
  });

  const premiumCount = customers.filter(c => (c.totalSpent || 0) > 5000).length;

  return (
    <View style={styles.section}>
      <SectionHeader title="Customer records" meta="Profiles and dues" light />

      <View style={[styles.highlight, dynamicStyles.highlight]}>
        <Text style={[styles.highlightLabel, dynamicStyles.highlightLabel]}>Loyalty overview</Text>
        <Text style={[styles.highlightText, dynamicStyles.highlightText]}>
          {customers.length > 0
            ? `${premiumCount} premium customers found in your database.`
            : "No customer records found yet."}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : (
        customers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12
  },
  highlight: {
    ...Platform.select({
      ios: {
        borderRadius: radius.sm,
        padding: 18,
        marginBottom: 8,
      },
      android: {
        borderRadius: radius.md,
        padding: 14,
        marginBottom: 6,
      },
      web: {
        borderRadius: radius.lg,
        padding: 16,
        marginBottom: 8,
      }
    })
  },
  highlightLabel: {
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 6,
    ...Platform.select({
      ios: { fontSize: 13 },
      android: { fontSize: 11 },
      web: { fontSize: 12 }
    })
  },
  highlightText: {
    ...Platform.select({
      ios: { fontSize: 14.5, lineHeight: 21 },
      android: { fontSize: 13, lineHeight: 18 },
      web: { fontSize: 14, lineHeight: 20 }
    })
  }
});
