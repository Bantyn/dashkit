import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Pressable,
  Text,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ProductCard } from "../components/ProductCard";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";
import { getInventoryByShop, getProductByBarcode, updateStock, createProduct, getProductsByShop } from "../api";
import { CustomAlert } from "../components/CustomAlert";
import { hasPermission } from "../utils/permissions";

const { width, height } = Dimensions.get("window");

export function InventoryScreen({ user, refreshSignal, onRefreshComplete }: { user: any, refreshSignal?: number, onRefreshComplete?: () => void }) {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Camera Permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newStockValue, setNewStockValue] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  // Create Product Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [newProductData, setNewProductData] = useState({
    name: "",
    category: "Men",
    price: "",
    stock: "",
    brand: "",
  });

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as any,
  });

  useEffect(() => {
    fetchInventory(false);
  }, []);

  useEffect(() => {
    if (refreshSignal && refreshSignal > 0) {
        fetchInventory(true);
    }
  }, [refreshSignal]);

  const fetchInventory = async (force = false) => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      // Fetch inventory and pre-warm product cache in parallel
      // This ensures barcode scans are resolved locally (instant) instead of over the network
      const [invResponse] = await Promise.all([
        getInventoryByShop(user.shopId, force),
        getProductsByShop(user.shopId, force), // pre-warms _cachedProductList for barcode lookup
      ]);
      if (invResponse.success) {
        setInventory(invResponse.data);
      }
    } catch (error) {
      console.error("Fetch inventory error:", error);
    } finally {
      setLoading(false);
      if (onRefreshComplete) onRefreshComplete();
    }
  };

  const showAlert = (title: string, message: string, type: any = "info") => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannerVisible(false);
    processScannedBarcode(data);
  };

  const processScannedBarcode = async (barcode: string) => {
    try {
      const response = await getProductByBarcode(user.shopId, barcode);
      if (response.success && response.data) {
        const product = response.data;
        const invItem = inventory.find(item => item.variantSku === barcode);
        setSelectedProduct({ ...product, barcode, currentStock: invItem?.currentStock || 0 });
        setNewStockValue(String(invItem?.currentStock || 0));
        setEditModalVisible(true);
      } else {
        setScannedBarcode(barcode);
        setNewProductData({
            name: "",
            category: "Men",
            price: "",
            stock: "",
            brand: user?.branch || ""
        });
        setCreateModalVisible(true);
      }
    } catch (error) {
      showAlert("Error", String(error), "danger");
    } finally {
        setTimeout(() => setScanned(false), 1000);
    }
  };

  const handleUpdateStock = async () => {
    if (!hasPermission(user, "inventory.edit")) {
      showAlert("Permission Denied", "You do not have permission to update stock levels.", "danger");
      return;
    }
    if (!selectedProduct || !newStockValue) return;
    setUpdateLoading(true);
    try {
      const amount = parseInt(newStockValue) - selectedProduct.currentStock;
      await updateStock({
        productId: selectedProduct.id,
        shopId: user.shopId,
        newStock: parseInt(newStockValue),
        variantSku: selectedProduct.barcode,
        reason: "Manual Mobile Update",
        changeType: amount >= 0 ? "add" : "subtract",
        amount: Math.abs(amount),
        updatedBy: user.id
      });
      showAlert("Success", "Stock updated successfully", "success");
      setEditModalVisible(false);
      fetchInventory();
    } catch (error) {
      showAlert("Error", String(error), "danger");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!hasPermission(user, "products.create")) {
      showAlert("Permission Denied", "You do not have permission to add new products.", "danger");
      return;
    }
    if (!newProductData.name || !newProductData.price || !newProductData.stock) {
        showAlert("Warning", "Please fill all required fields", "warning");
        return;
    }
    setUpdateLoading(true);
    try {
      const productPayload = {
        name: newProductData.name,
        shopId: user.shopId,
        category: newProductData.category,
        brand: newProductData.brand,
        variants: [{
            sku: scannedBarcode,
            price: parseFloat(newProductData.price),
            stock: parseInt(newProductData.stock),
            size: "Standard",
            color: "Default"
        }],
        isActive: true,
        createdBy: user.id
      };
      await createProduct(productPayload);
      showAlert("Success", "Product created and stock initialized", "success");
      setCreateModalVisible(false);
      fetchInventory();
    } catch (error) {
      showAlert("Error", String(error), "danger");
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return inventory;
    return inventory.filter(
      (p) =>
        p.productName?.toLowerCase().includes(query) ||
        p.variantSku?.toLowerCase().includes(query)
    );
  }, [search, inventory]);

  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const lowStock = inventory.filter(i => i.currentStock <= i.lowStockThreshold).length;
    return { totalItems, lowStock };
  }, [inventory]);

  const dynamicStyles = StyleSheet.create({
    searchInput: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.textPrimary,
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      fontWeight: "600"
    },
    scanButton: {
      backgroundColor: colors.brand,
      padding: 16,
      borderRadius: radius.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
      gap: 10,
      elevation: 4
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        maxHeight: height * 0.8,
    },
    modalInput: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
        padding: 14,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    submitButton: {
        backgroundColor: colors.brand,
        padding: 16,
        borderRadius: radius.pill,
        alignItems: "center",
        marginTop: 30,
        marginBottom: 10,
    }
  });

  return (
    <View style={styles.section}>
      <SectionHeader title="Inventory" meta="Live stock tracking" light />

      <Pressable
        style={dynamicStyles.scanButton}
        onPress={async () => {
            if (!permission?.granted) {
                const res = await requestPermission();
                if (!res.granted) {
                    showAlert("No Access", "Camera permission is required to scan barcodes.", "danger");
                    return;
                }
            }
            setScannerVisible(true);
        }}
      >
        <Ionicons name="barcode-outline" size={24} color={colors.white} />
        <Text style={{color: colors.white, fontWeight: "800", fontSize: 16}}>BARCODE SCAN</Text>
      </Pressable>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search product or enter barcode..."
        placeholderTextColor={colors.textMuted}
        style={dynamicStyles.searchInput}
        onSubmitEditing={() => search && processScannedBarcode(search)}
      />

      <View style={styles.row}>
        <StatCard label="Total SKUs" value={String(stats.totalItems)} />
        <StatCard label="Low stock" value={String(stats.lowStock)} accent={stats.lowStock > 0} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{marginTop: 40}} />
      ) : (
        filteredItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
                setSelectedProduct({
                    id: item.productId,
                    name: item.productName,
                    barcode: item.variantSku,
                    currentStock: item.currentStock
                });
                setNewStockValue(String(item.currentStock));
                setEditModalVisible(true);
            }}
          >
            <ProductCard
                product={{
                    id: item.id,
                    name: item.productName,
                    category: item.variantSku,
                    price: "₹" + (item.price || 0),
                    stock: item.currentStock
                }}
            />
          </Pressable>
        ))
      )}

      {/* Barcode Scanner Modal using expo-camera */}
      <Modal visible={scannerVisible} animationType="fade">
        <View style={{ flex: 1, backgroundColor: "black" }}>
            <View style={{ position: "absolute", top: 50, left: 20, zIndex: 10 }}>
                <TouchableOpacity onPress={() => setScannerVisible(false)}>
                    <Ionicons name="close-circle" size={40} color="white" />
                </TouchableOpacity>
            </View>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "ean13", "ean8", "code128", "upc_a", "upc_e"],
                }}
            />
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <View style={{ width: 250, height: 250, borderWidth: 2, borderColor: colors.brand, borderRadius: 20 }} />
                <Text style={{ color: "white", marginTop: 20, fontWeight: "600" }}>Align barcode within frame</Text>
            </View>
        </View>
      </Modal>

      {/* Edit Modal & Create Modal code stays same... */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={dynamicStyles.modalOverlay}>
            <View style={dynamicStyles.modalContent}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>Update Stock</Text>
                    <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                        <Ionicons name="close" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <Text style={{fontSize: 16, fontWeight: "700", color: colors.brand}}>{selectedProduct?.name}</Text>
                <Text style={{fontSize: 12, color: colors.textMuted}}>SKU: {selectedProduct?.barcode}</Text>
                <Text style={{marginTop: 16, marginBottom: 8, fontWeight: "700", color: colors.textSecondary}}>Current Stock</Text>
                <TextInput style={dynamicStyles.modalInput} value={newStockValue} onChangeText={setNewStockValue} keyboardType="number-pad" />
                <TouchableOpacity style={dynamicStyles.submitButton} onPress={handleUpdateStock} disabled={updateLoading}>
                    {updateLoading ? <ActivityIndicator color={colors.white} /> : <Text style={{color: "white", fontWeight: "800"}}>UPDATE STOCK</Text>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={createModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={dynamicStyles.modalOverlay}>
            <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: "flex-end"}}>
                <View style={dynamicStyles.modalContent}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                        <View>
                            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>New Product Found</Text>
                            <Text style={{color: colors.textMuted}}>Barcode: {scannedBarcode}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                            <Ionicons name="close" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <TextInput style={dynamicStyles.modalInput} placeholder="Product Name *" value={newProductData.name} onChangeText={(t) => setNewProductData({...newProductData, name: t})} />
                    <View style={{flexDirection: "row", gap: 12, marginTop: 12}}>
                        <TextInput style={[dynamicStyles.modalInput, {flex:1}]} placeholder="Price *" keyboardType="numeric" value={newProductData.price} onChangeText={(t) => setNewProductData({...newProductData, price: t})} />
                        <TextInput style={[dynamicStyles.modalInput, {flex:1}]} placeholder="Initial Stock *" keyboardType="number-pad" value={newProductData.stock} onChangeText={(t) => setNewProductData({...newProductData, stock: t})} />
                    </View>
                    <TouchableOpacity style={dynamicStyles.submitButton} onPress={handleCreateProduct} disabled={updateLoading}>
                        {updateLoading ? <ActivityIndicator color={colors.white} /> : <Text style={{color: "white", fontWeight: "800"}}>SAVE & ADD TO STOCK</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  row: { flexDirection: "row", gap: 12 }
});
