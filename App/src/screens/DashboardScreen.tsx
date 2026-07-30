import React, { useState, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { radius } from "../theme";
import type { TabKey, User } from "../types";
import { ActionCard } from "../components/ActionCard";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { InvoiceCard } from "../components/InvoiceCard";
import { useTheme } from "../ThemeContext";
import { getDashboardData } from "../api";
import { hasPermission } from "../utils/permissions";

export interface RoleDashboardConfig {
  heroLabel: string;
  heroTitle: string;
  heroColor: string;
  badge1Label: string;
  badge2Label: string;
  statusTitle: string;
  defaultShortcuts: TabKey[];
}

export function getRoleDashboardConfig(roleName?: string, shopName?: string): RoleDashboardConfig {
  const normalized = (roleName || "").toLowerCase().replace(/\s+/g, "_");

  if (normalized.includes("owner")) {
    return {
      heroLabel: "Executive Business Overview",
      heroTitle: `${shopName || "DashKit"} Owner Portal`,
      heroColor: "#7379E8",
      badge1Label: "Today Revenue",
      badge2Label: "Invoices Today",
      statusTitle: "Business Operational Metrics",
      defaultShortcuts: ["pos", "orders", "inventory", "products", "customers", "staff", "delivery"],
    };
  }

  if (normalized.includes("manager")) {
    return {
      heroLabel: "Operations & Daily Closing",
      heroTitle: `${shopName || "DashKit"} Manager Portal`,
      heroColor: "#3B82F6",
      badge1Label: "Daily Sales",
      badge2Label: "Orders Completed",
      statusTitle: "Store Live Operations",
      defaultShortcuts: ["pos", "orders", "inventory", "products", "staff"],
    };
  }

  if (normalized.includes("cashier")) {
    return {
      heroLabel: "POS Cashier Counter",
      heroTitle: "Daily Billing & Collection",
      heroColor: "#10B981",
      badge1Label: "Today Cash Collection",
      badge2Label: "Bills Processed",
      statusTitle: "Counter Live Receipts",
      defaultShortcuts: ["pos", "orders", "customers"],
    };
  }

  if (normalized.includes("sales")) {
    return {
      heroLabel: "Sales Executive Desk",
      heroTitle: "Personal Sales Counter",
      heroColor: "#6366F1",
      badge1Label: "Sales Value Today",
      badge2Label: "Invoices Created",
      statusTitle: "Sales Performance Status",
      defaultShortcuts: ["pos", "products", "customers"],
    };
  }

  if (normalized.includes("inventory")) {
    return {
      heroLabel: "Warehouse & SKU Logistics",
      heroTitle: "Stock Control Hub",
      heroColor: "#F59E0B",
      badge1Label: "SKU Total Count",
      badge2Label: "Low Stock Alerts",
      statusTitle: "Inventory & Stock Levels",
      defaultShortcuts: ["inventory", "products"],
    };
  }

  if (normalized.includes("purchase")) {
    return {
      heroLabel: "Procurement & Suppliers",
      heroTitle: "Purchase Orders Desk",
      heroColor: "#EA580C",
      badge1Label: "Purchase Value",
      badge2Label: "Pending Orders",
      statusTitle: "Supplier & Inbound Status",
      defaultShortcuts: ["inventory", "products"],
    };
  }

  if (normalized.includes("accountant")) {
    return {
      heroLabel: "Finance & Cashbook Ledger",
      heroTitle: "Accounts Summary",
      heroColor: "#14B8A6",
      badge1Label: "Cash Receivables",
      badge2Label: "Completed Invoices",
      statusTitle: "Financial Balances",
      defaultShortcuts: ["orders", "customers"],
    };
  }

  if (normalized.includes("crm")) {
    return {
      heroLabel: "Customer Relationship Portal",
      heroTitle: "CRM & Retention Overview",
      heroColor: "#F43F5E",
      badge1Label: "Registered Buyers",
      badge2Label: "Active Store Members",
      statusTitle: "Customer Engagement Metrics",
      defaultShortcuts: ["customers", "orders"],
    };
  }

  if (normalized.includes("marketing")) {
    return {
      heroLabel: "Campaigns & Promotions",
      heroTitle: "Marketing Operations",
      heroColor: "#A855F7",
      badge1Label: "Active Discounts",
      badge2Label: "Traffic Conversions",
      statusTitle: "Promotion Performance",
      defaultShortcuts: ["products", "customers"],
    };
  }

  if (normalized.includes("website")) {
    return {
      heroLabel: "Storefront Web E-Commerce",
      heroTitle: "Online Store Operations",
      heroColor: "#06B6D4",
      badge1Label: "Web Revenue",
      badge2Label: "Online Orders",
      statusTitle: "Storefront Traffic",
      defaultShortcuts: ["products", "orders"],
    };
  }

  if (normalized.includes("tailor")) {
    return {
      heroLabel: "Tailoring Production Unit",
      heroTitle: "Job Cards & Garment Orders",
      heroColor: "#EC4899",
      badge1Label: "Active Job Cards",
      badge2Label: "Ready Garments",
      statusTitle: "Tailoring Queue",
      defaultShortcuts: ["orders"],
    };
  }

  if (normalized.includes("delivery")) {
    return {
      heroLabel: "Delivery & Route Dispatch",
      heroTitle: "Logistics Route Overview",
      heroColor: "#8B5CF6",
      badge1Label: "Remaining Stops",
      badge2Label: "COD Collection",
      statusTitle: "Delivery Dispatch Status",
      defaultShortcuts: ["delivery" as TabKey, "orders"],
    };
  }

  if (normalized.includes("branch")) {
    return {
      heroLabel: "Branch Operational Hub",
      heroTitle: "Branch Performance Overview",
      heroColor: "#1E40AF",
      badge1Label: "Branch Sales",
      badge2Label: "Branch Invoices",
      statusTitle: "Local Branch Metrics",
      defaultShortcuts: ["pos", "inventory", "staff"],
    };
  }

  if (normalized.includes("auditor")) {
    return {
      heroLabel: "Compliance & Audit Log Portal",
      heroTitle: "Read-Only Audit Ledger",
      heroColor: "#64748B",
      badge1Label: "Audit Records",
      badge2Label: "System Logs",
      statusTitle: "Compliance Health Status",
      defaultShortcuts: ["orders", "inventory"],
    };
  }

  return {
    heroLabel: "Operations Summary",
    heroTitle: `${shopName || "DashKit"} Dashboard`,
    heroColor: "#7379E8",
    badge1Label: "Today Revenue",
    badge2Label: "Invoices Today",
    statusTitle: "Live Operational Metrics",
    defaultShortcuts: ["pos", "orders", "inventory", "products", "customers"],
  };
}

const getActionIcon = (target: TabKey) => {
  switch (target) {
    case "pos": return "add-circle";
    case "orders": return "receipt";
    case "inventory": return "cube";
    case "products": return "shirt";
    case "customers": return "people";
    case "staff": return "shield-checkmark";
    case "delivery": return "map";
    default: return "flash";
  }
};

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

    setLoading(true);
    try {
      const isAdmin = user.role === "Admin" || user.role === "Manager" || user.role === "Shop Owner" || user.role === "Store Manager" || user.role === "owner";
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

  const roleConfig = useMemo(() => {
    return getRoleDashboardConfig(user?.role, user?.shopName);
  }, [user]);

  const filteredQuickActions = useMemo(() => {
    const allAvailableActions: { title: string; caption: string; target: TabKey }[] = [
      { title: "New POS Sale", caption: "Open POS billing & checkout counter", target: "pos" },
      { title: "View Store Sales", caption: "Track all completed orders & invoices", target: "orders" },
      { title: "Check Stock & SKUs", caption: "Monitor inventory levels & stock alerts", target: "inventory" },
      { title: "Product Catalog", caption: "Manage products, pricing & categories", target: "products" },
      { title: "Customer Profiles", caption: "View directory, tier & credit status", target: "customers" },
      { title: "Manage Staff Roles", caption: "Configure store employees & access", target: "staff" },
      { title: "Delivery Logistics", caption: "Track dispatch routes & COD deliveries", target: "delivery" },
    ];

    const isOwnerOrAdmin = (user?.role || "").toLowerCase().includes("owner") || (user?.role || "").toLowerCase().includes("admin");

    if (isOwnerOrAdmin) {
      return allAvailableActions;
    }

    return allAvailableActions.filter((act) => {
      if (act.target === "pos") return hasPermission(user, "invoices.create") || hasPermission(user, "sales.create");
      if (act.target === "orders") return hasPermission(user, "invoices.view") || hasPermission(user, "sales.view");
      if (act.target === "inventory") return hasPermission(user, "inventory.view");
      if (act.target === "products") return hasPermission(user, "products.view");
      if (act.target === "customers") return hasPermission(user, "customers.view");
      if (act.target === "staff") return hasPermission(user, "staff.view");
      if (act.target === "delivery") return hasPermission(user, "delivery.view");
      return false;
    });
  }, [user]);

  const dynamicStyles = StyleSheet.create({
    hero: {
      backgroundColor: roleConfig.heroColor,
      borderRadius: radius.xl,
      padding: 22,
      gap: 18
    },
    heroTitle: {
      color: colors.white,
      fontSize: 21,
      lineHeight: 25,
      fontWeight: "800",
      marginBottom: 4
    }
  });

  // Live 7-day Bar Graph dataset computed dynamically from real store sales
  const barGraphData = useMemo(() => {
    if (data?.weeklyBarData && Array.isArray(data.weeklyBarData) && data.weeklyBarData.length > 0) {
      return data.weeklyBarData.map((item: any) => ({
        day: item.day,
        value: item.value || 10,
        rawAmount: item.rawAmount || 0,
        color: (item.day === "Fri" || item.day === "Sat") ? roleConfig.heroColor : "#8E94F2",
      }));
    }

    return [
      { day: "Mon", value: 10, rawAmount: 0, color: "#8E94F2" },
      { day: "Tue", value: 15, rawAmount: 0, color: "#8E94F2" },
      { day: "Wed", value: 10, rawAmount: 0, color: "#8E94F2" },
      { day: "Thu", value: 20, rawAmount: 0, color: "#8E94F2" },
      { day: "Fri", value: 30, rawAmount: 0, color: roleConfig.heroColor },
      { day: "Sat", value: 45, rawAmount: 0, color: roleConfig.heroColor },
      { day: "Sun", value: 25, rawAmount: 0, color: "#8E94F2" },
    ];
  }, [data, roleConfig]);

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
      {/* Personalized Hero Banner for Active Staff Role */}
      <View style={dynamicStyles.hero}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heroLabel}>{roleConfig.heroLabel}</Text>
            <Text style={dynamicStyles.heroTitle}>{roleConfig.heroTitle}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <Ionicons name="briefcase" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 13, fontWeight: "600", marginLeft: 6 }}>
                Assigned Role: {user?.role || "Staff"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeValue}>₹{(stats.totalRevenue || 0).toLocaleString()}</Text>
            <Text style={styles.heroBadgeLabel}>{roleConfig.badge1Label}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeValue}>{stats.totalInvoices || 0}</Text>
            <Text style={styles.heroBadgeLabel}>{roleConfig.badge2Label}</Text>
          </View>
        </View>
      </View>

      {/* Orders & Stock Stats */}
      <View style={styles.row}>
        <StatCard label="Total Orders" value={String(stats.totalOrders || 0)} />
        <StatCard
          label="Low Stock Alert"
          value={String(stats.lowStockProducts || 0) + " SKUs"}
          accent={stats.lowStockProducts > 0}
        />
      </View>

      {/* 📊 Business Operational Metrics & Visual Bar Chart (Placed BEFORE Quick Shortcuts) */}
      <View>
        <SectionHeader title={roleConfig.statusTitle} meta="Weekly trend & live metrics" />
        
        <View style={styles.chartCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="bar-chart" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>Weekly Revenue</Text>
            </View>
            <View style={{ backgroundColor: roleConfig.heroColor + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill }}>
              <Text style={{ color: roleConfig.heroColor, fontWeight: "700", fontSize: 11 }}>Live Trend</Text>
            </View>
          </View>

          {/* SVG Visual Bar Chart */}
          <Svg width={300} height={100} style={{ alignSelf: "center" }}>
            <Line x1="0" y1="80" x2="300" y2="80" stroke={colors.border} strokeWidth="1" strokeDasharray="3 3" />
            {barGraphData.map((bar: any, index: number) => {
              const x = 20 + index * 40;
              const barHeight = bar.value * 0.7;
              const y = 80 - barHeight;
              return (
                <React.Fragment key={bar.day}>
                  <Rect
                    x={x}
                    y={y}
                    width={22}
                    height={barHeight}
                    rx={6}
                    fill={bar.color}
                  />
                  <SvgText
                    x={x + 11}
                    y={95}
                    fontSize="10"
                    fontWeight="700"
                    fill={colors.textMuted}
                    textAnchor="middle"
                  >
                    {bar.day}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Live Metrics Rows */}
          <View style={styles.simpleStats}>
            <View style={styles.statusRow}>
              <Text style={{ color: colors.textSecondary }}>Pending Invoices</Text>
              <Text style={{ color: colors.warningText, fontWeight: "700" }}>{stats.pendingInvoices || 0}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={{ color: colors.textSecondary }}>Registered Customers</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{stats.totalCustomers || 0}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={{ color: colors.textSecondary }}>Online Active Buyers</Text>
              <Text style={{ color: colors.brand, fontWeight: "700" }}>{stats.totalOnlineCustomers || 0} active</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Full Size Quick Action Cards */}
      {filteredQuickActions.length > 0 && (
        <View>
          <SectionHeader title="Quick Shortcuts" meta="Permitted operations" />
          <View style={styles.actionsList}>
            {filteredQuickActions.map((action) => (
              <ActionCard
                key={action.title}
                title={action.title}
                caption={action.caption}
                iconName={getActionIcon(action.target)}
                onPress={() => onJump(action.target)}
                width="48%"
              />
            ))}
          </View>
        </View>
      )}

      {/* Recent Invoices */}
      {data?.recentInvoices?.length > 0 && (
        <>
          <SectionHeader title="Recent Activity" meta="Latest completed invoices" />
          <View style={{ gap: 12 }}>
            {data.recentInvoices.map((inv: any) => (
              <InvoiceCard key={inv.id} invoice={inv} />
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
    alignItems: "flex-start"
  },
  heroLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4
  },
  heroStats: {
    flexDirection: "row",
    gap: 12
  },
  heroBadge: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 14,
    borderRadius: radius.md
  },
  heroBadgeValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800"
  },
  heroBadgeLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  row: {
    flexDirection: "row",
    gap: 12
  },
  chartCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    padding: 16,
    borderRadius: radius.lg,
    gap: 14,
  },
  actionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    width: "100%",
  },
  simpleStats: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    padding: 14,
    borderRadius: radius.md,
    gap: 10,
    marginTop: 6,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  }
});
