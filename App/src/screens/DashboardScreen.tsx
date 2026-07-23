import React, { useState, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View, ActivityIndicator, ScrollView, RefreshControl } from "react-native";

import { quickActions } from "../data/mockData";
import { radius } from "../theme";
import type { TabKey, User } from "../types";
import { ActionCard } from "../components/ActionCard";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { InvoiceCard } from "../components/InvoiceCard";
import { useTheme } from "../ThemeContext";
import { getDashboardData } from "../api";
import { hasPermission } from "../utils/permissions";

export function DashboardScreen({ onJump, user, refreshSignal, onRefreshComplete }: { onJump: (tab: TabKey) => void, user: User, refreshSignal?: number, onRefreshComplete?: () => void }) {
  const { colors } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard(false);
  }, []);

  useEffect(() => {
    if (refreshSignal && refreshSignal > 0) {
      fetchDashboard(true);
    }
  }, [refreshSignal]);

  const fetchDashboard = async (force = false) => {
    if (!user?.shopId) return;

    if (!hasPermission(user, "analytics.view")) {
      setLoading(false);
      setRefreshing(false);
      if (onRefreshComplete) onRefreshComplete();
      return;
    }

    setLoading(true);
    try {
      // Admin and Managers see shop-wide data, others see only their own
      const isAdmin = user.role === "Admin" || user.role === "Manager";
      const staffId = isAdmin ? undefined : user.id;

      const response = await getDashboardData(user.shopId, staffId, force);
      if (response && response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (onRefreshComplete) onRefreshComplete();
    }
  };

  const filteredQuickActions = useMemo(() => {
    let actions = [...quickActions];

    // If user has invoice view permission, add View Orders action
    if (hasPermission(user, "invoices.view")) {
      actions.push({ title: "View Orders", caption: "Track all store sales", target: "orders" as TabKey });
    }

    // If user is a Manager, they see extra management actions as quick buttons 
    // instead of navigation tabs
    if (user.role === "Manager") {
      if (hasPermission(user, "staff.view")) {
        actions.push({ title: "Staff Manage", caption: "Manage store employees", target: "staff" as TabKey });
      }
      if (hasPermission(user, "products.view")) {
        actions.push({ title: "Product Manage", caption: "Manage catalog & pricing", target: "products" as TabKey });
      }
    }

    return actions.filter(action => {
      if (action.target === "pos") return hasPermission(user, "invoices.create");
      if (action.target === "inventory") return hasPermission(user, "inventory.view");
      if (action.target === "customers") return hasPermission(user, "customers.create");
      if (action.target === "orders") return hasPermission(user, "invoices.view");
      return true;
    });
  }, [user]);

  const dynamicStyles = StyleSheet.create({
    hero: {
      backgroundColor: colors.surfaceAccent,
      borderRadius: radius.xl,
      padding: 22,
      gap: 18
    },
    heroTitle: {
      color: colors.white,
      fontSize: 31,
      lineHeight: 35,
      fontWeight: "800",
      marginBottom: 8
    }
  });

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 }}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  const stats = data?.stats || {};

  return (
    <View style={styles.section}>

      {/* Sales Hero - Only for those who can view invoices/analytics */}
      {hasPermission(user, "analytics.view") && (
        <View style={dynamicStyles.hero}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.heroLabel}>Home Dashboard</Text>
              <Text style={dynamicStyles.heroTitle}>Operations Summary</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeValue}>₹{(stats.totalRevenue || 0).toLocaleString()}</Text>
              <Text style={styles.heroBadgeLabel}>Today Sales</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeValue}>{stats.totalInvoices || 0}</Text>
              <Text style={styles.heroBadgeLabel}>Invoices Today</Text>
            </View>
          </View>
        </View>
      )}

      {/* Orders & Stock Stats */}
      {hasPermission(user, "analytics.view") && (
        <View style={styles.row}>
          <StatCard label="Total Orders" value={String(stats.totalOrders || 0)} />
          <StatCard
            label="Low Stock"
            value={String(stats.lowStockProducts || 0) + " SKUs"}
            accent={stats.lowStockProducts > 0}
          />
        </View>
      )}

      {/* Quick Actions - Filtered by role */}
      {filteredQuickActions.length > 0 && (
        <>
          <SectionHeader title="Quick buttons" meta="Fast access" />
          <View style={styles.actionsGrid}>
            {filteredQuickActions.map((action) => (
              <ActionCard
                key={action.title}
                title={action.title}
                caption={action.caption}
                onPress={() => onJump(action.target)}
              />
            ))}
          </View>
        </>
      )}

      {/* Store Status - Restricted based on permissions */}
      {hasPermission(user, "analytics.view") && (
        <>
          <SectionHeader title="Store Status" meta="Live overview" />
          <View style={styles.simpleStats}>
            <View style={styles.statusRow}>
              <Text style={{ color: colors.textSecondary }}>Pending Invoices</Text>
              <Text style={{ color: colors.warningText, fontWeight: "700" }}>{stats.pendingInvoices || 0}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={{ color: colors.textSecondary }}>Total Customers</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{stats.totalCustomers || 0}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={{ color: colors.textSecondary }}>Online Traffic</Text>
              <Text style={{ color: colors.brand, fontWeight: "700" }}>{stats.totalOnlineCustomers || 0} users</Text>
            </View>
          </View>
        </>
      )}

      {/* Recent Invoices - Only for those who can view invoices */}
      {hasPermission(user, "invoices.view") && data?.recentInvoices?.length > 0 && (
        <>
          <SectionHeader title="Recent Invoices" meta="Latest sales" />
          <View style={{ gap: 12 }}>
            {data.recentInvoices.map((inv: any) => (
              <InvoiceCard key={inv.id} invoice={inv} />
            ))}
          </View>
        </>
      )}

      {/* Top Products - Only if analytics or invoices visible */}
      {(hasPermission(user, "analytics.view") || hasPermission(user, "invoices.view")) && data?.topProducts?.length > 0 && (
        <>
          <SectionHeader title="Best Sellers" meta="By items sold" />
          <View style={[styles.topProductsList, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            {data.topProducts.map((product: any, index: number) => (
              <View
                key={product.id}
                style={[
                  styles.topProductRow,
                  index < data.topProducts.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border + '70' }
                ]}
              >
                <View style={styles.rankContainer}>
                  <Text style={[styles.rankText, { color: index === 0 ? colors.warningText : colors.textMuted }]}>
                    {index === 0 ? "🏆" : `#${index + 1}`}
                  </Text>
                </View>
                <View style={[styles.productIcon, { backgroundColor: colors.brand + "10" }]}>
                  <Text style={[styles.productIconText, { color: colors.brand }]}>{product.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>{product.name}</Text>
                  <Text style={[styles.productMeta, { color: colors.textSecondary }]}>{product.category} • {product.sold} sold</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.productRevenue, { color: colors.textPrimary }]}>₹{(product.revenue || 0).toLocaleString()}</Text>
                  {index === 0 && <Text style={{ fontSize: 10, color: colors.successText, fontWeight: '500', letterSpacing: 0.5, marginTop: 2 }}>Top Picks</Text>}
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 20
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  heroLabel: {
    color: "#d5e5ff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 10
  },
  heroStats: {
    flexDirection: "row",
    gap: 12
  },
  heroBadge: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.lg,
    padding: 14
  },
  heroBadgeValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800"
  },
  heroBadgeLabel: {
    color: "#d5e5ff",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    gap: 12
  },
  actionsGrid: {
    gap: 12
  },
  simpleStats: {
    padding: 16,
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: radius.lg
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  topProductsList: {
    borderRadius: radius.lg,
    padding: 4,
    overflow: "hidden"
  },
  topProductRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12
  },
  rankContainer: {
    width: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  rankText: {
    fontSize: 14,
    fontWeight: "800",
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  productIconText: {
    fontWeight: "800",
    fontSize: 14
  },
  productName: {
    fontSize: 15,
    fontWeight: "700"
  },
  productMeta: {
    fontSize: 12,
    marginTop: 2
  },
  productRevenue: {
    fontWeight: "800",
    fontSize: 15
  }
});
