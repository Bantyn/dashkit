import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { hasPermission } from "../utils/permissions";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ProductCard } from "../components/ProductCard";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import type { Product, User } from "../types";
import { useTheme } from "../ThemeContext";
import { getProductsByShop, createProduct, updateProduct, deleteProduct, getCategoriesByShop } from "../api";
import { radius } from "../theme";
import { CustomAlert } from "../components/CustomAlert";

const PRESET_COLORS = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Orange", "Brown", "Grey", "Navy"];
const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size", "4", "6", "8", "10", "12", "14"];

// ── Reusable Custom Dropdown Component ──────────────────────────────────────
function CustomDropdown({
  label,
  value,
  options,
  onSelect,
  colors,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  colors: any;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 0, zIndex: open ? 100 : 1 }}>
      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor: open ? colors.brand : colors.border,
          borderRadius: radius.md,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: colors.surface,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={{ color: value ? colors.textPrimary : colors.textMuted, fontSize: 13, fontWeight: "600" }}>
          {value || label}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {open && (
        <ScrollView
          nestedScrollEnabled
          style={{
            position: "absolute",
            top: 44,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            maxHeight: 180,
            zIndex: 999,
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: value === opt ? colors.brand + "15" : "transparent",
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: value === opt ? colors.brand : colors.textPrimary }}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function ProductsScreen({ user, refreshSignal, onRefreshComplete }: { user: User, refreshSignal?: number, onRefreshComplete?: () => void }) {
  const { colors } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Shop Categories State
  const [shopCategories, setShopCategories] = useState<string[]>([]);

  // Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [variants, setVariants] = useState<Array<{ id: string; color: string; size: string; price: string; stock: string }>>([
    { id: "1", color: "Black", size: "M", price: "", stock: "" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image Picker State
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as any,
  });


  useEffect(() => {
    fetchProducts(false);
    fetchCategories();
  }, []);

  useEffect(() => {
    if (refreshSignal && refreshSignal > 0) {
      fetchProducts(true);
    }
  }, [refreshSignal]);

  const fetchCategories = async () => {
    if (!user?.shopId) return;
    try {
      const res = await getCategoriesByShop(user.shopId);
      if (res && res.data && Array.isArray(res.data)) {
        const names = res.data.map((c: any) => c.name || c).filter(Boolean);
        setShopCategories(names);
      }
    } catch (e) {
      // fallback — no error shown
    }
  };


  const fetchProducts = async (force = false) => {
    if (!user?.shopId) return;

    if (!hasPermission(user, "products.view")) {
      setProducts([]);
      setLoading(false);
      if (onRefreshComplete) onRefreshComplete();
      return;
    }

    setLoading(true);
    try {
      const response = await getProductsByShop(user.shopId, force);
      if (response && response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Products fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (onRefreshComplete) onRefreshComplete();
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setEditName("");
    setEditCategory("");
    setEditBrand("");
    setEditPrice("");
    setEditStock("");
    setEditImageUri(null);
    setVariants([
      { id: "1", color: "Black", size: "M", price: "", stock: "" },
      { id: "2", color: "Red", size: "L", price: "", stock: "" }
    ]);
    setModalVisible(true);
  };

  const handleEdit = (product: any) => {
    if (!hasPermission(user, "products.edit")) {
      setAlertConfig({
        visible: true,
        title: "Permission Denied",
        message: "You do not have permission to edit products.",
        type: "danger"
      });
      return;
    }
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category || "");
    setEditBrand(product.brand || "");
    setEditPrice(String(product.price || ""));
    setEditStock(String(product.stockQuantity || "0"));
    setEditImageUri(product.imageUrl || product.image || null);

    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      setVariants(product.variants.map((v: any, idx: number) => ({
        id: String(idx + 1),
        color: v.color || "",
        size: v.size || "",
        price: String(v.price || product.price || ""),
        stock: String(v.stock || v.stockQuantity || "0")
      })));
    } else {
      setVariants([{ id: "1", color: "Black", size: "M", price: String(product.price || ""), stock: String(product.stockQuantity || "0") }]);
    }

    setModalVisible(true);
  };

  const addVariantRow = () => {
    setVariants(prev => [
      ...prev,
      { id: Date.now().toString(), color: "", size: "M", price: editPrice, stock: editStock || "10" }
    ]);
  };

  const removeVariantRow = (id: string) => {
    if (variants.length <= 1) return;
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariantField = (id: string, field: "color" | "size" | "price" | "stock", value: string) => {
    setVariants(prev => prev.map(v => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const handleUpdate = async () => {
    if (editingProduct && !hasPermission(user, "products.edit")) return;
    if (!editingProduct && !hasPermission(user, "products.create")) return;

    if (!editName) {
      setAlertConfig({
        visible: true,
        title: "Required",
        message: "Product name is required",
        type: "warning"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const basePrice = Number(editPrice) || 0;
      const baseStock = Number(editStock) || 0;

      const productData = {
        name: editName,
        category: editCategory,
        brand: editBrand,
        shopId: user.shopId,
        price: basePrice,
        stockQuantity: baseStock,
        variants: variants.map(v => ({
          color: v.color || "Standard",
          size: v.size || "Free Size",
          price: Number(v.price) || basePrice,
          stock: Number(v.stock) || baseStock,
          sku: `${(editName || "PRD").substring(0, 3).toUpperCase()}-${(v.color || "DEF").substring(0, 3).toUpperCase()}-${v.size || "STD"}-${Math.floor(100 + Math.random() * 900)}`
        }))
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setAlertConfig({
          visible: true,
          title: "Success",
          message: "Product & variants updated successfully",
          type: "success"
        });
      } else {
        await createProduct(productData);
        setAlertConfig({
          visible: true,
          title: "Success",
          message: "Product with color & size variants created successfully",
          type: "success"
        });
      }

      setModalVisible(false);
      fetchProducts();
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: String(error),
        type: "danger"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!hasPermission(user, "products.delete")) {
      setAlertConfig({
        visible: true,
        title: "Permission Denied",
        message: "You do not have permission to delete products.",
        type: "danger"
      });
      return;
    }
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(id);
              setAlertConfig({
                visible: true,
                title: "Deleted",
                message: "Product removed from catalog",
                type: "success"
              });
              setModalVisible(false);
              fetchProducts();
            } catch (error) {
              setAlertConfig({
                visible: true,
                title: "Error",
                message: String(error),
                type: "danger"
              });
            }
          }
        }
      ]
    );
  };

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query)
    );
  }, [search, products]);

  const stats = useMemo(() => {
    const total = products.length;
    // Calculate low stock across all variants if available
    const lowStock = products.filter(p =>
      p.variants?.some((v: any) => v.stock <= (v.lowStockThreshold || 10))
    ).length;
    return { total, lowStock };
  }, [products]);

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
      fontWeight: "600",
      marginBottom: 10
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
      maxHeight: "80%"
    },
    input: {
      borderColor: colors.border,
      color: colors.textPrimary,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: 14,
      marginBottom: 16,
      fontSize: 16
    },
    submitButton: {
      backgroundColor: colors.brand,
      padding: 16,
      borderRadius: radius.pill,
      alignItems: "center",
      marginTop: 20,
      marginBottom: 30
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: -140,
      width: 60,
      height: 60,
      backgroundColor: colors.brand,
      borderRadius: radius.pill,
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      zIndex: 100
    }
  });

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="Product Catalog" meta="Stock and pricing" light />

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search product or category"
        placeholderTextColor={colors.textMuted}
        style={dynamicStyles.searchInput}
      />

      <View style={styles.row}>
        <StatCard label="Total Items" value={String(stats.total)} />
        <StatCard label="Low Stock" value={String(stats.lowStock)} accent={stats.lowStock > 0} />
      </View>

      <View style={{ marginTop: 10, gap: 12, paddingBottom: 100 }}>
        {filteredItems.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Ionicons name="cube-outline" size={60} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 10, fontWeight: "600" }}>No products found</Text>
          </View>
        ) : (
          filteredItems.map((product) => {
            // Find lowest price and total stock for display
            const minPrice = product.variants && product.variants.length > 0
              ? Math.min(...product.variants.map((v: any) => v.price))
              : product.price || 0;
            const totalStock = product.variants && product.variants.length > 0
              ? product.variants.reduce((sum: number, v: any) => sum + v.stock, 0)
              : product.stockQuantity || 0;

            return (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  category: product.category || "General",
                  price: "₹" + minPrice,
                  stock: totalStock
                }}
                onEdit={hasPermission(user, "products.edit") ? () => handleEdit(product) : undefined}
              />
            );
          })
        )}
      </View>

      {hasPermission(user, "products.create") && (
        <TouchableOpacity
          style={dynamicStyles.fab}
          onPress={handleAddProduct}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={dynamicStyles.modalContainer}
        >
          <View style={dynamicStyles.modalContent}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Product Image Picker */}
              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>PRODUCT IMAGE</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                {editImageUri ? (
                  <View style={{ flex: 1, position: "relative" }}>
                    <Image
                      source={{ uri: editImageUri }}
                      style={{ width: "100%", height: 120, borderRadius: radius.md, backgroundColor: colors.surfaceMuted }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={{ position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: radius.pill, padding: 4 }}
                      onPress={() => setEditImageUri(null)}
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flex: 1, height: 120, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted }}>
                    <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>No image selected</Text>
                  </View>
                )}
                <View style={{ gap: 8, justifyContent: "center" }}>
                  <TouchableOpacity
                    style={{ backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: 6 }}
                    onPress={() => { setImagePickerVisible(true); setCameraMode(false); }}
                  >
                    <Ionicons name="folder-open-outline" size={16} color={colors.brand} />
                    <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 12 }}>Browse</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: 6 }}
                    onPress={async () => {
                      if (!cameraPermission?.granted) {
                        const perm = await requestCameraPermission();
                        if (!perm.granted) { Alert.alert("Permission Denied", "Camera permission is required."); return; }
                      }
                      setImagePickerVisible(true);
                      setCameraMode(true);
                    }}
                  >
                    <Ionicons name="camera-outline" size={16} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12 }}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>PRODUCT NAME *</Text>
              <TextInput
                style={dynamicStyles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Product name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>CATEGORY</Text>
              <View style={{ marginBottom: 16, zIndex: 200 }}>
                <CustomDropdown
                  label="Select Category"
                  value={editCategory}
                  options={shopCategories.length > 0 ? shopCategories : ["General", "Clothing", "Electronics", "Food", "Beauty", "Sports"]}
                  onSelect={setEditCategory}
                  colors={colors}
                />
              </View>

              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>BRAND</Text>
              <TextInput
                style={dynamicStyles.input}
                value={editBrand}
                onChangeText={setEditBrand}
                placeholder="Brand (optional)"
                placeholderTextColor={colors.textMuted}
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>BASE PRICE (₹)</Text>
                  <TextInput
                    style={dynamicStyles.input}
                    value={editPrice}
                    onChangeText={setEditPrice}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>BASE STOCK</Text>
                  <TextInput
                    style={dynamicStyles.input}
                    value={editStock}
                    onChangeText={setEditStock}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Color & Size Variant Builder */}
              <View style={{ marginTop: 10, marginBottom: 16, padding: 14, backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="color-palette-outline" size={18} color={colors.brand} />
                    <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 13 }}>COLOR & SIZE VARIANTS</Text>
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: colors.brand, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", gap: 4 }}
                    onPress={addVariantRow}
                  >
                    <Ionicons name="add" size={14} color="white" />
                    <Text style={{ color: "white", fontSize: 11, fontWeight: "800" }}>Add</Text>
                  </TouchableOpacity>
                </View>

                {variants.map((v, idx) => (
                  <View key={v.id} style={{ backgroundColor: colors.surface, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: colors.brand }}>Variant #{idx + 1}</Text>
                      {variants.length > 1 && (
                        <TouchableOpacity onPress={() => removeVariantRow(v.id)}>
                          <Ionicons name="trash-outline" size={16} color={colors.dangerText} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 8, zIndex: 100 - idx }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 4 }}>COLOR</Text>
                        <CustomDropdown
                          label="Color"
                          value={v.color}
                          options={PRESET_COLORS}
                          onSelect={(val) => updateVariantField(v.id, "color", val)}
                          colors={colors}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 4 }}>SIZE</Text>
                        <CustomDropdown
                          label="Size"
                          value={v.size}
                          options={PRESET_SIZES}
                          onSelect={(val) => updateVariantField(v.id, "size", val)}
                          colors={colors}
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 4 }}>PRICE (₹)</Text>
                        <TextInput
                          style={[dynamicStyles.input, { marginBottom: 0, paddingVertical: 8, fontSize: 13 }]}
                          value={v.price}
                          onChangeText={(val) => updateVariantField(v.id, "price", val)}
                          placeholder={editPrice || "Price"}
                          keyboardType="numeric"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 4 }}>QTY</Text>
                        <TextInput
                          style={[dynamicStyles.input, { marginBottom: 0, paddingVertical: 8, fontSize: 13 }]}
                          value={v.stock}
                          onChangeText={(val) => updateVariantField(v.id, "stock", val)}
                          placeholder={editStock || "Qty"}
                          keyboardType="numeric"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={dynamicStyles.submitButton}
                onPress={handleUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
                    {editingProduct ? "UPDATE PRODUCT" : "CREATE PRODUCT"}
                  </Text>
                )}
              </TouchableOpacity>

              {editingProduct && hasPermission(user, "products.delete") && (
                <TouchableOpacity
                  style={{ marginTop: 20, alignItems: "center" }}
                  onPress={() => handleDelete(editingProduct?.id)}
                >
                  <Text style={{ color: colors.dangerText, fontWeight: "700" }}>DELETE PRODUCT</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Professional Full-Screen Image Picker Modal ────────────────────────── */}
      <Modal visible={imagePickerVisible} animationType="fade" presentationStyle="fullScreen">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {cameraMode && cameraPermission?.granted ? (
            /* ─── Camera Viewfinder ─────────────────────────────────── */
            <View style={{ flex: 1 }}>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                ref={(ref) => setCameraRef(ref)}
              />

              {/* Top bar */}
              <View style={{
                position: "absolute", top: 0, left: 0, right: 0,
                paddingTop: Platform.OS === "ios" ? 50 : 32,
                paddingHorizontal: 20, paddingBottom: 16,
                flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.4)"
              }}>
                <TouchableOpacity
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
                  onPress={() => { setCameraMode(false); setImagePickerVisible(false); }}
                >
                  <Ionicons name="close" size={22} color="white" />
                </TouchableOpacity>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16, letterSpacing: 0.5 }}>Product Photo</Text>
                <TouchableOpacity
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
                  onPress={() => setCameraMode(false)}
                >
                  <Ionicons name="link-outline" size={20} color="white" />
                </TouchableOpacity>
              </View>

              {/* Bottom controls */}
              <View style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                paddingBottom: Platform.OS === "ios" ? 48 : 32,
                paddingTop: 24, paddingHorizontal: 40,
                backgroundColor: "rgba(0,0,0,0.5)",
                flexDirection: "row", alignItems: "center", justifyContent: "center"
              }}>
                {/* Shutter button */}
                <TouchableOpacity
                  style={{
                    width: 76, height: 76, borderRadius: 38,
                    backgroundColor: "white",
                    borderWidth: 4, borderColor: "rgba(255,255,255,0.4)",
                    alignItems: "center", justifyContent: "center",
                    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 10, elevation: 8
                  }}
                  onPress={async () => {
                    if (cameraRef) {
                      const photo = await cameraRef.takePictureAsync({ quality: 0.8 });
                      if (photo?.uri) { setEditImageUri(photo.uri); }
                    }
                    setImagePickerVisible(false);
                    setCameraMode(false);
                  }}
                >
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff" }} />
                </TouchableOpacity>
              </View>

              {/* Grid overlay hint */}
              <View style={{
                position: "absolute", top: 100, left: 0, right: 0, bottom: 100,
                borderWidth: 0
              }}>
                {/* Rule of thirds guides - subtle */}
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: "rgba(255,255,255,0.2)" }} />
                  <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: "rgba(255,255,255,0.2)" }} />
                  <View style={{ flex: 1 }} />
                </View>
              </View>
            </View>
          ) : (
            /* ─── URL / Choose Mode Sheet ───────────────────────────── */
            <View style={{ flex: 1, backgroundColor: colors.surface }}>
              {/* Header */}
              <View style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingTop: Platform.OS === "ios" ? 52 : 28, paddingHorizontal: 20, paddingBottom: 14,
                borderBottomWidth: 1, borderBottomColor: colors.border
              }}>
                <TouchableOpacity
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}
                  onPress={() => setImagePickerVisible(false)}
                >
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ fontWeight: "800", fontSize: 16, color: colors.textPrimary }}>Add Product Image</Text>
                <View style={{ width: 36 }} />
              </View>

              <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
                {/* Camera option tile */}
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.brand, borderRadius: radius.xl,
                    padding: 24, alignItems: "center", gap: 10,
                    flexDirection: "row"
                  }}
                  onPress={async () => {
                    if (!cameraPermission?.granted) {
                      const perm = await requestCameraPermission();
                      if (!perm.granted) { Alert.alert("Permission Denied", "Camera access is required to take photos."); return; }
                    }
                    setCameraMode(true);
                  }}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="camera" size={26} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>Take a Photo</Text>
                    <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>Capture product using camera</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>

                {/* Separator */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600" }}>or paste image URL</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                </View>

                {/* URL Input area */}
                <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 12, marginBottom: 8 }}>IMAGE URL</Text>
                  <TextInput
                    style={[dynamicStyles.input, { marginBottom: 12, backgroundColor: colors.surface }]}
                    placeholder="https://example.com/product.jpg"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="url"
                    returnKeyType="done"
                    onChangeText={(text) => setEditImageUri(text.trim() || null)}
                  />
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.textPrimary, paddingVertical: 12,
                      borderRadius: radius.md, alignItems: "center",
                      flexDirection: "row", justifyContent: "center", gap: 6
                    }}
                    onPress={() => {
                      if (editImageUri) { setImagePickerVisible(false); }
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={colors.surface} />
                    <Text style={{ color: colors.surface, fontWeight: "800" }}>Use This Image</Text>
                  </TouchableOpacity>
                </View>

                {/* Remove current image */}
                {editImageUri ? (
                  <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Image source={{ uri: editImageUri }} style={{ width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.border }} resizeMode="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 12 }}>Current Image</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }} numberOfLines={1}>{editImageUri}</Text>
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: colors.dangerBg, padding: 8, borderRadius: radius.md }}
                      onPress={() => { setEditImageUri(null); setImagePickerVisible(false); }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.dangerText} />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={{ alignItems: "center", paddingVertical: 12 }}
                  onPress={() => setImagePickerVisible(false)}
                >
                  <Text style={{ color: colors.textMuted, fontWeight: "600", fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
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
  section: {
    gap: 14
  },
  row: {
    flexDirection: "row",
    gap: 12
  }
});
