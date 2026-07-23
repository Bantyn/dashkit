import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";
import { SectionHeader } from "../components/SectionHeader";
import { getProductByBarcode, findCustomerByPhone, createInvoice } from "../api";
import { CustomAlert } from "../components/CustomAlert";
import { User } from "../types";
import { hasPermission } from "../utils/permissions";

export function POSScreen({ user }: { user: User }) {
  const { colors, theme } = useTheme();

  // Billing State
  const [cart, setCart] = useState<any[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(true);

  // Scanner State
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const isProcessingScan = useRef(false); // Synchronization Lock

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as any,
  });

  // Auto-fetch customer name when phone length is 10
  useEffect(() => {
    if (customerPhone.length === 10) {
      handleSearchCustomer();
    }
  }, [customerPhone]);

  const showAlert = (title: string, message: string, type: any = "info") => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleSearchCustomer = async () => {
    try {
      const response = await findCustomerByPhone(user.shopId, customerPhone);
      if (response && response.data) {
        setCustomerName(response.data.name);
        setIsNewCustomer(false);
      } else {
        setIsNewCustomer(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onBarCodeScanned = async ({ data }: { data: string }) => {
    // If already processing or state says scanned, ignore
    if (isProcessingScan.current || scanned) return;

    isProcessingScan.current = true; // Lock immediately
    setScanned(true);
    setScannerVisible(false);

    try {
      setLoading(true);
      const response = await getProductByBarcode(user.shopId, data);
      if (response && response.data) {
        const product = response.data;
        const variant = product.variants.find((v: any) => v.sku === data);

        if (variant) {
          addToCart(product, variant, data);
        } else {
          showAlert("Error", "Variant not found for this barcode", "danger");
        }
      } else {
        showAlert("Not Found", "Product not found in database", "warning");
      }
    } catch (error) {
      showAlert("Error", "Failed to fetch product", "danger");
    } finally {
      setLoading(false);
      // Wait a bit before allowing next scan to prevent accidental double scans
      setTimeout(() => {
        isProcessingScan.current = false;
        setScanned(false);
      }, 1500);
    }
  };

  const addToCart = (product: any, variant: any, barcode: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.variantSku === barcode);
      if (existing) {
        return prev.map(item =>
          item.variantSku === barcode ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        variantSku: barcode,
        unitPrice: variant.price,
        quantity: 1,
        category: product.category,
        size: variant.size || "N/A",
        color: variant.color || "N/A",
        image: product.images?.[0] || null
      }];
    });
  };

  const removeFromCart = (sku: string) => {
    setCart(prev => prev.filter(item => item.variantSku !== sku));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const disc = parseFloat(discount) || 0;
    return subtotal - disc;
  };

  const handleCheckout = async () => {
    if (!hasPermission(user, "invoices.create")) {
      showAlert("Permission Denied", "You do not have permission to create invoices. Please contact your admin.", "danger");
      return;
    }

    if (cart.length === 0) {
      showAlert("Empty Cart", "Please add items to bill", "warning");
      return;
    }
    if (!customerPhone || customerPhone.length < 10) {
      showAlert("Customer Info", "Please enter a valid mobile number", "warning");
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        shopId: user.shopId,
        employeeId: user.id,
        employeeName: user.fullName, // Capture staff name
        employeeRole: user.role, // Capture staff role
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone,
        items: cart,
        subtotal: calculateSubtotal(),
        discount: parseFloat(discount) || 0,
        total: calculateTotal(),
        status: "paid",
        paymentMethod: "cash",
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(), // Send current date
      };

      const response = await createInvoice(invoiceData);
      if (response && response.success) {
        showAlert("Success", "Billing completed successfully!", "success");
        setCart([]);
        setCustomerPhone("");
        setCustomerName("");
        setDiscount("0");
      }
    } catch (error) {
      showAlert("Billing Failed", String(error), "danger");
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, gap: 16 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      padding: 12,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 15,
    },
    scanButton: {
      backgroundColor: colors.brand,
      padding: 18,
      borderRadius: radius.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    cartItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    checkoutButton: {
      backgroundColor: colors.brandStrong,
      padding: 18,
      borderRadius: radius.pill,
      alignItems: "center",
      marginTop: 10,
    }
  });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={dynamicStyles.container}>
        <SectionHeader title="POS Billing" meta="New Sale" light />

        {/* Customer Section */}
        <View style={dynamicStyles.card}>
          <Text style={{ fontWeight: "700", marginBottom: 10, color: colors.textSecondary }}>CUSTOMER DETAILS</Text>
          <View style={{ gap: 12 }}>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Mobile Number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />
            <TextInput
              style={dynamicStyles.input}
              placeholder="Customer Name"
              placeholderTextColor={colors.textMuted}
              value={customerName}
              onChangeText={setCustomerName}
            />
            {isNewCustomer && customerPhone.length === 10 && (
              <Text style={{ fontSize: 11, color: colors.brand }}>* New customer will be registered</Text>
            )}
          </View>
        </View>

        {/* Scanner Button */}
        <Pressable
          style={dynamicStyles.scanButton}
          onPress={async () => {
            if (!permission?.granted) {
              const res = await requestPermission();
              if (!res.granted) return;
            }
            isProcessingScan.current = false; // Reset lock when opening scanner
            setScanned(false);
            setScannerVisible(true);
          }}
        >
          <Ionicons name="barcode-outline" size={24} color="white" />
          <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>SCAN PRODUCT</Text>
        </Pressable>

        {/* Cart Section */}
        <View style={dynamicStyles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
            <Text style={{ fontWeight: "700", color: colors.textSecondary }}>ITEMS IN CART ({cart.length})</Text>
            <TouchableOpacity onPress={() => setCart([])}><Text style={{ color: colors.dangerText }}>Clear</Text></TouchableOpacity>
          </View>

          {cart.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Ionicons name="cart-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 10 }}>No items added yet</Text>
            </View>
          ) : (
            cart.map((item) => (
              <View key={item.variantSku} style={dynamicStyles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{item.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    SKU: {item.variantSku} | ₹{item.unitPrice} | Size: {item.size} | Color: {item.color}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
                  <Text style={{ fontWeight: "800", color: colors.brand }}>x{item.quantity}</Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.variantSku)}>
                    <Ionicons name="trash-outline" size={20} color={colors.dangerText} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* Billing Summary */}
          <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 }}>
            <View style={dynamicStyles.totalRow}>
              <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>₹{calculateSubtotal().toLocaleString()}</Text>
            </View>
            <View style={dynamicStyles.totalRow}>
              <Text style={{ color: colors.textSecondary }}>Discount</Text>
              <TextInput
                style={{ color: colors.successText, fontWeight: "600", borderBottomWidth: 1, borderBottomColor: colors.successText, minWidth: 50, textAlign: "right" }}
                keyboardType="numeric"
                value={discount}
                onChangeText={setDiscount}
              />
            </View>
            <View style={[dynamicStyles.totalRow, { marginTop: 10 }]}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>Total</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.brandStrong }}>₹{calculateTotal().toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={dynamicStyles.checkoutButton}
              onPress={handleCheckout}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "800", fontSize: 18 }}>COMPLETE BILLING</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Camera Modal */}
      <Modal visible={scannerVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <View style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}>
            <TouchableOpacity onPress={() => setScannerVisible(false)}>
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>
          </View>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : onBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128", "upc_a", "upc_e"] }}
          />
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: 250, height: 250, borderWidth: 2, borderColor: "white", borderRadius: 20 }} />
            <Text style={{ color: "white", marginTop: 20 }}>Scanning...</Text>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </ScrollView>
  );
}
