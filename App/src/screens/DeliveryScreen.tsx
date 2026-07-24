import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Line } from "react-native-svg";
import { useTheme } from "../ThemeContext";
import { radius } from "../theme";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { FilterChip } from "../components/FilterChip";
import type { User } from "../types";
import { getStaffDeliveries, respondToDeliveryAssignment, updateDeliveryStatusApi } from "../api";

export interface DeliveryItem {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  amount: string;
  paymentType: "COD" | "Prepaid";
  status: "Pending" | "waiting_for_delivery_acceptance" | "delivery_accepted" | "reached_store" | "picked_up" | "out_for_delivery" | "reached_customer" | "delivered" | "rejected_by_delivery";
  sequence: number;
  notes?: string;
  itemsCount?: number;
}

const MOCK_DELIVERIES: DeliveryItem[] = [
  {
    id: "del_1",
    orderId: "ORD-1049",
    customerName: "Ananya Roy",
    customerPhone: "+91 98765-11223",
    address: "74 Park Street, Flat 4B, Sector 2",
    amount: "₹2,450",
    paymentType: "COD",
    status: "out_for_delivery",
    sequence: 1,
    itemsCount: 3,
  },
  {
    id: "del_2",
    orderId: "ORD-1052",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 98112-33445",
    address: "12 Lake Road, Opp. City Mall",
    amount: "₹1,890",
    paymentType: "Prepaid",
    status: "waiting_for_delivery_acceptance",
    sequence: 2,
    itemsCount: 1,
  },
];

export function DeliveryScreen({ user }: { user: User }) {
  const { colors } = useTheme();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(MOCK_DELIVERIES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null);
  
  // OTP Verification Modal
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [inputOtp, setInputOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  // Rejection Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState("Not Available");

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await getStaffDeliveries(user.id);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: DeliveryItem[] = res.data.map((o: any, idx: number) => ({
          id: o.id,
          orderId: o.displayId || o.id.slice(-8).toUpperCase(),
          customerName: o.customerName || o.shippingAddress?.fullName || "Customer",
          customerPhone: o.customerPhone || o.shippingAddress?.phone || "+91 9876543210",
          address: o.shippingAddress ? `${o.shippingAddress.address || ''}, ${o.shippingAddress.city || ''} ${o.shippingAddress.pincode || ''}` : "Main City Address",
          amount: `₹${(o.totalAmount || 0).toLocaleString()}`,
          paymentType: (o.paymentMethod || "cod").toUpperCase() === "COD" ? "COD" : "Prepaid",
          status: o.orderStatus || "waiting_for_delivery_acceptance",
          sequence: idx + 1,
          itemsCount: o.items?.length || o.products?.length || 1,
        }));
        setDeliveries(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pendingAssignments = useMemo(() => {
    return deliveries.filter((d) => d.status === "waiting_for_delivery_acceptance");
  }, [deliveries]);

  const activeDeliveries = useMemo(() => {
    return deliveries.filter((d) => 
      d.status === "delivery_accepted" || 
      d.status === "reached_store" || 
      d.status === "picked_up" || 
      d.status === "out_for_delivery" || 
      d.status === "reached_customer"
    );
  }, [deliveries]);

  const completedDeliveries = useMemo(() => {
    return deliveries.filter((d) => d.status === "delivered");
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      const matchesSearch =
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerPhone.includes(searchQuery) ||
        item.orderId.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedFilter === "All") return matchesSearch;
      if (selectedFilter === "Pending") return matchesSearch && item.status === "waiting_for_delivery_acceptance";
      if (selectedFilter === "Active") return matchesSearch && activeDeliveries.some(a => a.id === item.id);
      if (selectedFilter === "Delivered") return matchesSearch && item.status === "delivered";
      return matchesSearch;
    });
  }, [deliveries, searchQuery, selectedFilter, activeDeliveries]);

  const handleAcceptAssignment = async (item: DeliveryItem) => {
    try {
      await respondToDeliveryAssignment(item.id, user.id, "accept");
      setDeliveries((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, status: "delivery_accepted" } : d))
      );
      setSelectedDelivery({ ...item, status: "delivery_accepted" });
      Alert.alert("Assignment Accepted", `Order ${item.orderId} accepted! Navigating to route.`);
    } catch (e: any) {
      Alert.alert("Error", String(e));
    }
  };

  const handleOpenRejectModal = (item: DeliveryItem) => {
    setRejectTargetId(item.id);
    setSelectedRejectReason("Not Available");
    setRejectModalVisible(true);
  };

  const handleConfirmRejectAssignment = async () => {
    if (!rejectTargetId) return;
    try {
      await respondToDeliveryAssignment(rejectTargetId, user.id, "reject", selectedRejectReason);
      setDeliveries((prev) => prev.filter((d) => d.id !== rejectTargetId));
      setRejectModalVisible(false);
      setRejectTargetId(null);
      Alert.alert("Assignment Declined", "Order has been returned to shop for reassignment.");
    } catch (e: any) {
      Alert.alert("Error", String(e));
    }
  };

  const handleProgressStatus = async (item: DeliveryItem, nextStatus: any) => {
    if (nextStatus === "delivered") {
      setSelectedDelivery(item);
      setOtpModalVisible(true);
      setInputOtp("");
      setOtpError("");
      return;
    }

    try {
      await updateDeliveryStatusApi(item.id, user.id, nextStatus);
      setDeliveries((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, status: nextStatus } : d))
      );
    } catch (e: any) {
      Alert.alert("Error", String(e));
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedDelivery) return;
    try {
      await updateDeliveryStatusApi(selectedDelivery.id, user.id, "delivered", inputOtp);
      setDeliveries((prev) =>
        prev.map((d) => (d.id === selectedDelivery.id ? { ...d, status: "delivered" } : d))
      );
      setOtpModalVisible(false);
      setSelectedDelivery(null);
      Alert.alert("Success", "Delivery verified and completed successfully!");
    } catch (e: any) {
      setOtpError("Invalid OTP. Try 1234 for testing.");
    }
  };

  const handleCallCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  const handleNavigateMap = (address: string) => {
    const query = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}`);
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
    },
    hero: {
      backgroundColor: colors.surfaceAccent,
      borderRadius: radius.xl,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    heroTitle: {
      color: colors.white,
      fontSize: 22,
      fontWeight: "800",
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: 14,
      marginBottom: 12,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 12,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
  });

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={dynamicStyles.hero}>
        <View>
          <Text style={dynamicStyles.heroTitle}>Delivery Route</Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" }}>
            {activeDeliveries.length} Active • {pendingAssignments.length} Requests
          </Text>
        </View>
        <View style={{ backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill }}>
          <Text style={{ color: colors.white, fontWeight: "800", fontSize: 13 }}>
            Completed: {completedDeliveries.length}
          </Text>
        </View>
      </View>

      {/* Stage 4: Incoming Assignment Requests Cards */}
      {pendingAssignments.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <SectionHeader title="New Delivery Requests" meta="Action Required" />
          {pendingAssignments.map((item) => (
            <View key={item.id} style={[dynamicStyles.card, { borderColor: colors.brand, borderWidth: 2, backgroundColor: colors.surfaceMuted }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ backgroundColor: colors.brand, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill }}>
                  <Text style={{ color: "white", fontSize: 11, fontWeight: "800" }}>ASSIGNED TO YOU</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.brand }}>{item.amount} ({item.paymentType})</Text>
              </View>

              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary, marginBottom: 2 }}>{item.customerName}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <Ionicons name="location" size={14} color={colors.textSecondary} />
                <Text style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }} numberOfLines={1}>{item.address}</Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>{item.itemsCount} Items • Order #{item.orderId}</Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  style={{ flex: 1, backgroundColor: colors.dangerBg, paddingVertical: 10, borderRadius: radius.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 }}
                  onPress={() => handleOpenRejectModal(item)}
                >
                  <Ionicons name="close-circle" size={16} color={colors.dangerText} />
                  <Text style={{ color: colors.dangerText, fontWeight: "800", fontSize: 13 }}>Decline</Text>
                </Pressable>
                <Pressable
                  style={{ flex: 2, backgroundColor: colors.brand, paddingVertical: 10, borderRadius: radius.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 }}
                  onPress={() => handleAcceptAssignment(item)}
                >
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text style={{ color: "white", fontWeight: "800", fontSize: 13 }}>Accept</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Search Input Bar */}
      <View style={dynamicStyles.searchBar}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Search by customer, phone, or order ID..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Filter Chips Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.filterRow}>
        {["All", "Active", "Pending", "Delivered"].map((chip) => (
          <FilterChip
            key={chip}
            label={chip}
            selected={selectedFilter === chip}
            onPress={() => setSelectedFilter(chip)}
          />
        ))}
      </ScrollView>

      {/* Delivery List */}
      <SectionHeader title="Assigned Delivery List" meta={`${filteredDeliveries.length} orders`} />

      {filteredDeliveries.map((item) => {
        const isDelivered = item.status === "delivered";

        return (
          <View key={item.id} style={[dynamicStyles.card, { padding: 14 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ backgroundColor: isDelivered ? colors.successBg : colors.surfaceMuted, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: isDelivered ? colors.successText : colors.textPrimary, fontSize: 14, fontWeight: "800" }}>{item.sequence}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>{item.customerName}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>Order {item.orderId} • {item.paymentType}</Text>
                </View>
              </View>
              
              <View style={{ alignItems: "flex-end" }}>
                 <Text style={{ fontSize: 16, fontWeight: "800", color: colors.brand }}>{item.amount}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 6 }}>
              <Ionicons name="location" size={16} color={colors.textSecondary} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, flex: 1 }} numberOfLines={2}>{item.address}</Text>
            </View>

            {/* Quick Action Navigation & Phone buttons */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              <Pressable
                style={{ flex: 1, backgroundColor: colors.surfaceMuted, paddingVertical: 8, borderRadius: radius.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 }}
                onPress={() => handleCallCustomer(item.customerPhone)}
              >
                <Ionicons name="call" size={15} color={colors.textPrimary} />
                <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12 }}>Call</Text>
              </Pressable>

              <Pressable
                style={{ flex: 1, backgroundColor: colors.surfaceMuted, paddingVertical: 8, borderRadius: radius.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 }}
                onPress={() => handleNavigateMap(item.address)}
              >
                <Ionicons name="navigate-circle" size={16} color={colors.brand} />
                <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 12 }}>Map</Text>
              </Pressable>
            </View>

            {/* Status Stepper Progression */}
            {!isDelivered ? (
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                {item.status === "delivery_accepted" && (
                  <Pressable
                    style={{ backgroundColor: colors.brand, paddingVertical: 10, borderRadius: radius.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
                    onPress={() => handleProgressStatus(item, "reached_store")}
                  >
                    <Ionicons name="storefront" size={16} color="white" />
                    <Text style={{ color: "white", fontWeight: "700" }}>Arrived at Store</Text>
                  </Pressable>
                )}
                {item.status === "reached_store" && (
                  <Pressable
                    style={{ backgroundColor: "#3B82F6", paddingVertical: 10, borderRadius: radius.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
                    onPress={() => handleProgressStatus(item, "picked_up")}
                  >
                    <Ionicons name="cube" size={16} color="white" />
                    <Text style={{ color: "white", fontWeight: "700" }}>Picked Up Order</Text>
                  </Pressable>
                )}
                {item.status === "picked_up" && (
                  <Pressable
                    style={{ backgroundColor: "#8B5CF6", paddingVertical: 10, borderRadius: radius.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
                    onPress={() => handleProgressStatus(item, "reached_customer")}
                  >
                    <Ionicons name="location" size={16} color="white" />
                    <Text style={{ color: "white", fontWeight: "700" }}>Arrived at Customer</Text>
                  </Pressable>
                )}
                {(item.status === "reached_customer" || item.status === "out_for_delivery") && (
                  <Pressable
                    style={{ backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.successText, paddingVertical: 10, borderRadius: radius.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
                    onPress={() => handleProgressStatus(item, "delivered")}
                  >
                    <Ionicons name="key" size={16} color={colors.successText} />
                    <Text style={{ color: colors.successText, fontWeight: "800" }}>Verify OTP & Complete</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={{ flex: 1, backgroundColor: colors.successBg, paddingVertical: 8, borderRadius: radius.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}>
                <Ionicons name="checkmark-circle" size={18} color={colors.successText} />
                <Text style={{ fontWeight: "700", color: colors.successText }}>Delivered</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* OTP Delivery Verification Modal */}
      <Modal transparent visible={otpModalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brand + "15", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 12 }}>
              <Ionicons name="key" size={24} color={colors.brand} />
            </View>

            <Text style={{ fontSize: 19, fontWeight: "800", color: colors.textPrimary, textAlign: "center", marginBottom: 6 }}>
              Verify OTP for {selectedDelivery?.orderId}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 20 }}>
              Enter 4-digit OTP provided by customer ({selectedDelivery?.customerName}) to confirm delivery.
            </Text>

            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, fontSize: 20, fontWeight: "800", textAlign: "center", color: colors.textPrimary, backgroundColor: colors.surfaceMuted, marginBottom: 14 }}
              placeholder="OTP (e.g. 1234)"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              value={inputOtp}
              onChangeText={setInputOtp}
            />

            {otpError ? <Text style={{ color: colors.dangerText, fontSize: 12, marginBottom: 14, textAlign: "center", fontWeight: "600" }}>{otpError}</Text> : null}

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                style={{ flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: "center" }}
                onPress={() => setOtpModalVisible(false)}
              >
                <Text style={{ fontWeight: "700", color: colors.textPrimary }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={{ flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: "center" }}
                onPress={handleVerifyOtp}
              >
                <Text style={{ fontWeight: "700", color: "white" }}>Confirm Delivery</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delivery Rejection Reason Modal */}
      <Modal transparent visible={rejectModalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginBottom: 8 }}>
              Select Rejection Reason
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
              Why are you unable to fulfill this delivery assignment?
            </Text>

            {["Not Available", "Too Far", "Vehicle Issue", "Personal Reason", "Other"].map((reason) => (
              <Pressable
                key={reason}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: selectedRejectReason === reason ? colors.brand : colors.border,
                  backgroundColor: selectedRejectReason === reason ? colors.brand + "10" : colors.surface,
                  marginBottom: 8,
                }}
                onPress={() => setSelectedRejectReason(reason)}
              >
                <Text style={{ color: selectedRejectReason === reason ? colors.brand : colors.textPrimary, fontWeight: "700", fontSize: 13 }}>
                  {reason}
                </Text>
              </Pressable>
            ))}

            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
              <Pressable
                style={{ flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: "center" }}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={{ fontWeight: "700", color: colors.textPrimary }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={{ flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.dangerText, alignItems: "center" }}
                onPress={handleConfirmRejectAssignment}
              >
                <Text style={{ fontWeight: "700", color: "white" }}>Confirm Rejection</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
