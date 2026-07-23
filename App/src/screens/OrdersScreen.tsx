import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";
import { SectionHeader } from "../components/SectionHeader";
import { InvoiceCard } from "../components/InvoiceCard";
import { getInvoicesByShop, createReturnRequest, getReturnRequestsByShop } from "../api";
import { User, Invoice as AppInvoice, InvoiceStatus } from "../types";
import { CustomAlert } from "../components/CustomAlert";

export function OrdersScreen({ user, refreshSignal, onRefreshComplete }: { user: User, refreshSignal?: number, onRefreshComplete?: () => void }) {
  const { colors } = useTheme();
  
  // Data State
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("Orders");

  // Return Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Invoice, 2: Select Items
  const [searchInvoice, setSearchInvoice] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as any,
  });

  useEffect(() => {
    fetchData(false);
  }, []);

  useEffect(() => {
    if (refreshSignal && refreshSignal > 0) {
      fetchData(true);
    }
  }, [refreshSignal]);

  const fetchData = async (force = false) => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const isAdmin = user.role === "Admin" || user.role === "Manager";
      const staffId = isAdmin ? undefined : user.id;

      const [invRes, retRes] = await Promise.all([
        getInvoicesByShop(user.shopId, staffId, force),
        getReturnRequestsByShop(user.shopId, force)
      ]);

      if (invRes && invRes.success) {
        setAllInvoices(invRes.data || []);
      }
      if (retRes && retRes.success) {
        setReturnRequests(retRes.data || []);
      }
    } catch (error) {
      console.error("Orders screen fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (onRefreshComplete) onRefreshComplete();
    }
  };

  const filteredInvoices = useMemo(() => {
    return allInvoices.map((inv: any) => ({
      id: inv.invoiceNumber || inv.id?.slice(-8).toUpperCase() || "ORD-000",
      customer: inv.customerName || "Walk-in Customer",
      amount: `₹${(inv.total || 0).toLocaleString()}`,
      status: (inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : "Paid") as InvoiceStatus,
      date: inv.date ? new Date(inv.date).toLocaleDateString() : new Date(inv.createdAt?._seconds * 1000 || Date.now()).toLocaleDateString(),
    }));
  }, [allInvoices]);

  const stats = useMemo(() => {
    const pendingCount = allInvoices.filter(i => i.status === "pending").length;
    const ordersCount = allInvoices.length;
    return {
      orders: ordersCount,
      pending: pendingCount,
      returns: returnRequests.length
    };
  }, [allInvoices, returnRequests]);

  const handleStartReturn = () => {
    setStep(1);
    setSearchInvoice("");
    setSelectedInvoice(null);
    setReturnItems([]);
    setReason("");
    setModalVisible(true);
  };

  const selectInvoiceForReturn = (invoice: any) => {
    setSelectedInvoice(invoice);
    // Initialize return items with 0 quantity
    const items = (invoice.items || []).map((item: any) => ({
      ...item,
      returnQty: 0
    }));
    setReturnItems(items);
    setStep(2);
  };

  const toggleItemQuantity = (sku: string, delta: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.variantSku === sku) {
        const newQty = Math.max(0, Math.min(item.quantity, item.returnQty + delta));
        return { ...item, returnQty: newQty };
      }
      return item;
    }));
  };

  const handleSubmitReturn = async () => {
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
    if (itemsToReturn.length === 0) {
      Alert.alert("Error", "Please select at least one item to return");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("Error", "Please provide a reason for return");
      return;
    }

    setIsSubmitting(true);
    try {
      const totalRefund = itemsToReturn.reduce((sum, i) => sum + (i.unitPrice * i.returnQty), 0);
      
      const payload = {
        shopId: user.shopId,
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        customerId: selectedInvoice.customerId,
        customerName: selectedInvoice.customerName,
        items: itemsToReturn.map(i => ({
          productId: i.productId,
          variantSku: i.variantSku,
          productName: i.productName || i.name,
          quantity: i.returnQty,
          unitPrice: i.unitPrice,
          refundAmount: i.unitPrice * i.returnQty
        })),
        totalRefundAmount: totalRefund,
        reason: reason,
        staffId: user.id
      };

      await createReturnRequest(payload);
      setAlertConfig({
        visible: true,
        title: "Success",
        message: "Return request submitted for approval",
        type: "success"
      });
      setModalVisible(false);
      fetchData(); // Refresh list
    } catch (error) {
      Alert.alert("Failed", String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    filterChip: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    filterActive: {
      backgroundColor: colors.brand,
      borderColor: colors.brand
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end"
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: 24,
      maxHeight: "90%"
    },
    invoiceSearchItem: {
      padding: 16,
      borderBottomWidth:1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between"
    },
    invoiceReturned: {
      opacity: 0.5,
      backgroundColor: colors.surfaceMuted
    }
  });

  const FilterChip = ({ label }: { label: string }) => (
    <Pressable 
      onPress={() => setActiveFilter(label)}
      style={[dynamicStyles.filterChip, activeFilter === label && dynamicStyles.filterActive]}
    >
      <Text style={{ 
        color: activeFilter === label ? colors.white : colors.textSecondary,
        fontWeight: "700",
        fontSize: 13
      }}>{label}</Text>
    </Pressable>
  );

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader 
        title={user.role === "Admin" || user.role === "Manager" ? "All Orders" : "My Orders"} 
        meta="Sales activity & returns" 
        light 
      />

      <View style={styles.statsRow}>
        <View style={[styles.miniStat, {backgroundColor: colors.surface}]}>
          <Text style={{color: colors.textSecondary, fontSize: 12}}>Orders</Text>
          <Text style={{color: colors.textPrimary, fontSize: 18, fontWeight: "800"}}>{stats.orders}</Text>
        </View>
        <View style={[styles.miniStat, {backgroundColor: colors.surface}]}>
          <Text style={{color: colors.textSecondary, fontSize: 12}}>Pending</Text>
          <Text style={{color: colors.warningText, fontSize: 18, fontWeight: "800"}}>{stats.pending}</Text>
        </View>
        <View style={[styles.miniStat, {backgroundColor: colors.surface}]}>
          <Text style={{color: colors.textSecondary, fontSize: 12}}>Returns</Text>
          <Text style={{color: colors.dangerText, fontSize: 18, fontWeight: "800"}}>{stats.returns}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <FilterChip label="Orders" />
        <FilterChip label="Returns" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
          {activeFilter === "Orders" ? (
             <View style={styles.listContainer}>
                {filteredInvoices.length === 0 ? (
                    <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 40 }}>No orders found.</Text>
                ) : (
                    filteredInvoices.map((order) => (
                    <InvoiceCard key={order.id} invoice={order} />
                    ))
                )}
             </View>
          ) : (
            <View style={styles.listContainer}>
                {returnRequests.length === 0 ? (
                    <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 40 }}>No return requests found.</Text>
                ) : (
                    returnRequests.map((ret: any) => (
                        <View key={ret.id} style={[styles.miniStat, { backgroundColor: colors.surface, marginBottom: 12, borderWidth: 1, borderColor: colors.border }]}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Text style={{ color: colors.textPrimary, fontWeight: "800" }}>{ret.invoiceNumber}</Text>
                                <Text style={{ color: colors.dangerText, fontWeight: "700" }}>₹{ret.totalRefundAmount}</Text>
                            </View>
                            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{ret.customerName}</Text>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{new Date(ret.createdAt?._seconds * 1000).toLocaleDateString()}</Text>
                                <Text style={{ color: colors.brand, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>{ret.status}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
          )}

          <TouchableOpacity style={styles.returnButton} onPress={handleStartReturn}>
            <Ionicons name="return-up-back" size={20} color={colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={{color: colors.textPrimary, fontWeight: "700"}}>Create Return Request</Text>
          </TouchableOpacity>
          <View style={{ height: 120 }} />
      </ScrollView>

      {/* Return Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.modalContent}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>
                {step === 1 ? "Select Invoice" : "Item Details"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {step === 1 ? (
                <View>
                    <TextInput 
                        style={{ backgroundColor: colors.surfaceMuted, padding: 14, borderRadius: radius.md, color: colors.textPrimary, marginBottom: 16 }}
                        placeholder="Search Invoice # or Customer"
                        placeholderTextColor={colors.textMuted}
                        value={searchInvoice}
                        onChangeText={setSearchInvoice}
                    />
                    <FlatList 
                        data={allInvoices.filter(i => 
                            i.invoiceNumber?.toLowerCase().includes(searchInvoice.toLowerCase()) || 
                            i.customerName?.toLowerCase().includes(searchInvoice.toLowerCase())
                        )}
                        keyExtractor={item => item.id}
                        ListEmptyComponent={() => (
                            <View style={{ padding: 40, alignItems: "center" }}>
                                <Text style={{ color: colors.textMuted }}>No invoices found matching "{searchInvoice}"</Text>
                            </View>
                        )}
                        renderItem={({ item }) => {
                            const isReturned = returnRequests.some(r => r.invoiceId === item.id);
                            return (
                                <TouchableOpacity 
                                    style={[dynamicStyles.invoiceSearchItem, isReturned && dynamicStyles.invoiceReturned]} 
                                    onPress={() => !isReturned && selectInvoiceForReturn(item)}
                                    disabled={isReturned}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{item.invoiceNumber || "No # Invoice"}</Text>
                                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                                            {item.customerName || "Walk-in Customer"}
                                            {isReturned && <Text style={{ color: colors.dangerText, fontWeight: "800" }}> • RETURNED</Text>}
                                        </Text>
                                    </View>
                                    <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>₹{(item.total || 0).toLocaleString()}</Text>
                                </TouchableOpacity>
                            );
                        }}
                        style={{ maxHeight: 400 }}
                    />
                </View>
            ) : (
                <View>
                    <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                        {returnItems.map(item => (
                            <View key={item.variantSku} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                                <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{item.productName || item.name}</Text>
                                <Text style={{ color: colors.textMuted, fontSize: 12 }}>SKU: {item.variantSku} | Max: {item.quantity}</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 15 }}>
                                    <TouchableOpacity onPress={() => toggleItemQuantity(item.variantSku, -1)} disabled={item.returnQty === 0}>
                                        <Ionicons name="remove-circle-outline" size={28} color={item.returnQty === 0 ? colors.textMuted : colors.brand} />
                                    </TouchableOpacity>
                                    <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "800", minWidth: 20, textAlign: "center" }}>{item.returnQty}</Text>
                                    <TouchableOpacity onPress={() => toggleItemQuantity(item.variantSku, 1)} disabled={item.returnQty >= item.quantity}>
                                        <Ionicons name="add-circle-outline" size={28} color={item.returnQty >= item.quantity ? colors.textMuted : colors.brand} />
                                    </TouchableOpacity>
                                    <View style={{ flex: 1 }} />
                                    <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>₹{item.unitPrice * item.returnQty}</Text>
                                </View>
                            </View>
                        ))}

                        <Text style={{ color: colors.textSecondary, fontWeight: "700", marginTop: 20, marginBottom: 8 }}>REASON FOR RETURN</Text>
                        <TextInput 
                            style={{ backgroundColor: colors.surfaceMuted, padding: 14, borderRadius: radius.md, color: colors.textPrimary, minHeight: 80 }}
                            multiline
                            placeholder="Defective, wrong size, etc."
                            placeholderTextColor={colors.textMuted}
                            value={reason}
                            onChangeText={setReason}
                        />
                    </ScrollView>

                    <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textSecondary }}>Total Refund</Text>
                            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.dangerText }}>
                                ₹{returnItems.reduce((sum, item) => sum + (item.unitPrice * item.returnQty), 0).toLocaleString()}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={{ backgroundColor: colors.brand, padding: 18, borderRadius: radius.pill, alignItems: "center" }}
                            onPress={handleSubmitReturn}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>SUBMIT RETURN REQUEST</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 5,
  },
  miniStat: {
    flex: 1,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 5,
  },
  listContainer: {
    gap: 12,
  },
  returnButton: {
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E0E4F5",
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  }
});
