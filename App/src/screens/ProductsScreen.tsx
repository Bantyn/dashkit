import React, { useState, useEffect, useMemo } from "react";
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
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { hasPermission } from "../utils/permissions";

import { ProductCard } from "../components/ProductCard";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import type { Product, User } from "../types";
import { useTheme } from "../ThemeContext";
import { getProductsByShop, createProduct, updateProduct, deleteProduct } from "../api";
import { radius } from "../theme";
import { CustomAlert } from "../components/CustomAlert";

export function ProductsScreen({ user, refreshSignal, onRefreshComplete }: { user: User, refreshSignal?: number, onRefreshComplete?: () => void }) {
  const { colors } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as any,
  });

  useEffect(() => {
    fetchProducts(false);
  }, []);

  useEffect(() => {
    if (refreshSignal && refreshSignal > 0) {
      fetchProducts(true);
    }
  }, [refreshSignal]);

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
    setModalVisible(true);
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
      const productData = {
        name: editName,
        category: editCategory,
        brand: editBrand,
        shopId: user.shopId,
        price: Number(editPrice) || 0,
        stockQuantity: Number(editStock) || 0
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setAlertConfig({
          visible: true,
          title: "Success",
          message: "Product updated successfully",
          type: "success"
        });
      } else {
        await createProduct(productData);
        setAlertConfig({
          visible: true,
          title: "Success",
          message: "Product created successfully",
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
      backgroundColor: colors.surfaceMuted,
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
      bottom: 20,
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
                  ? Math.min(...product.variants.map((v:any) => v.price))
                  : product.price || 0;
              const totalStock = product.variants && product.variants.length > 0
                  ? product.variants.reduce((sum:number, v:any) => sum + v.stock, 0)
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

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>PRODUCT NAME</Text>
              <TextInput
                style={dynamicStyles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>CATEGORY</Text>
              <TextInput
                style={dynamicStyles.input}
                value={editCategory}
                onChangeText={setEditCategory}
                placeholder="Category"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>BRAND</Text>
              <TextInput
                style={dynamicStyles.input}
                value={editBrand}
                onChangeText={setEditBrand}
                placeholder="Brand"
                placeholderTextColor={colors.textMuted}
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>PRICE (₹)</Text>
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
                  <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>STOCK</Text>
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
