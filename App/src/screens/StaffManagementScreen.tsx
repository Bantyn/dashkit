import React, { useState, useEffect } from "react";
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
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";
import { SectionHeader } from "../components/SectionHeader";
import { getStaffByShop, createStaff, updateStaff, deleteStaff } from "../api";
import { User } from "../types";
import { CustomAlert } from "../components/CustomAlert";
import { hasPermission } from "../utils/permissions";

export function StaffManagementScreen({ user, refreshSignal, onRefreshComplete }: { user: User, refreshSignal?: number, onRefreshComplete?: () => void }) {
  const { colors } = useTheme();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("Sales Staff");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<any>({
    invoices: { view: true, create: false, edit: false, delete: false },
    products: { view: true, create: false, edit: false, delete: false },
    inventory: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: false, delete: false },
    staff: { view: false, create: false, edit: false, delete: false },
    analytics: { view: false }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as any,
  });

  useEffect(() => {
    fetchStaff(false);
  }, []);

  useEffect(() => {
    if (refreshSignal && refreshSignal > 0) {
        fetchStaff(true);
    }
  }, [refreshSignal]);

  const fetchStaff = async (force = false) => {
    if (!user?.shopId) return;
    
    // Check permission before fetching to avoid 403 errors in logs
    if (!hasPermission(user, "staff.view")) {
        setStaff([]);
        setLoading(false);
        if (onRefreshComplete) onRefreshComplete();
        return;
    }

    setLoading(true);
    try {
      const response = await getStaffByShop(user.shopId, force);
      if (response && response.success) {
        setStaff(response.data);
      }
    } catch (error) {
      console.error("Staff fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (onRefreshComplete) onRefreshComplete();
    }
  };

  const showAlert = (title: string, message: string, type: any = "info") => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setRole("Sales Staff");
    setPassword("");
    setPermissions({
      invoices: { view: true, create: false, edit: false, delete: false },
      products: { view: true, create: false, edit: false, delete: false },
      inventory: { view: true, create: true, edit: true, delete: false },
      customers: { view: true, create: true, edit: false, delete: false },
      staff: { view: false, create: false, edit: false, delete: false },
      analytics: { view: false }
    });
    setEditingStaff(null);
  };

  const handleEdit = (item: any) => {
    setEditingStaff(item);
    setFullName(item.fullName);
    setEmail(item.email);
    setPhoneNumber(item.phoneNumber);
    setRole(item.role);
    setPassword(item.password || "");
    if (item.permissions) {
      setPermissions(item.permissions);
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!editingStaff && !hasPermission(user, "staff.create")) {
      showAlert("Permission Denied", "You do not have permission to add new staff members.", "danger");
      return;
    }

    if (editingStaff && !hasPermission(user, "staff.edit")) {
      showAlert("Permission Denied", "You do not have permission to edit staff members.", "danger");
      return;
    }

    if (!fullName || !email || !phoneNumber || (!editingStaff && !password)) {
      showAlert("Required Fields", "Please fill all required fields", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const staffData: any = {
        fullName,
        email,
        phoneNumber,
        role,
        shopId: user.shopId,
        status: "Active",
        permissions
      };

      if (password) staffData.password = password;

      if (editingStaff) {
        await updateStaff(editingStaff.id, staffData);
        showAlert("Success", "Staff record updated successfully", "success");
      } else {
        await createStaff(staffData);
        showAlert("Success", "New staff member added", "success");
      }
      setModalVisible(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      showAlert("Error", String(error), "danger");
    } finally {
      setIsSubmitting(false);
      if (onRefreshComplete) onRefreshComplete();
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to remove this staff member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!hasPermission(user, "staff.delete")) {
              showAlert("Permission Denied", "You do not have permission to delete staff members.", "danger");
              return;
            }
            try {
              await deleteStaff(id, user.shopId);
              showAlert("Deleted", "Staff member removed", "success");
              fetchStaff();
            } catch (error) {
              showAlert("Error", String(error), "danger");
            }
          }
        }
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, gap: 16 },
    staffCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.surfaceAccent + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
      alignSelf: "flex-start",
      marginTop: 4
    },
    fab: {
      position: "absolute",
      bottom: 25,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.brand,
      alignItems: "center",
      justifyContent: "center",
      elevation: 5,
      shadowColor: colors.brand,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
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
    input: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      padding: 14,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
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
    permissionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    permissionLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.textPrimary,
        width: 100
    },
    checkboxGroup: {
        flexDirection: "row",
        gap: 15,
        flex: 1,
        justifyContent: "flex-end"
    },
    checkboxLabel: {
        fontSize: 10,
        color: colors.textMuted,
        textAlign: "center",
        marginTop: 4,
        fontWeight: "bold"
    }
  });

  const togglePermission = (module: string, action: string) => {
    setPermissions((prev: any) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module][action]
      }
    }));
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <SectionHeader title="Staff Management" meta="Manage your staff" light />

      <View>
        <View style={{ paddingBottom: 100 }}>
          {staff.length === 0 ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Ionicons name="people-outline" size={60} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 10 }}>No staff members found</Text>
            </View>
          ) : (
            staff.map((item) => (
              <View key={item.id} style={dynamicStyles.staffCard}>
                <View style={dynamicStyles.avatar}>
                  <Text style={{ color: colors.brand, fontWeight: "800", fontSize: 18 }}>
                    {item.fullName ? item.fullName[0].toUpperCase() : "S"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 16 }}>{item.fullName}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.email}</Text>
                  <View style={dynamicStyles.roleBadge}>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: "700" }}>{item.role.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity onPress={() => handleEdit(item)}>
                    <Ionicons name="create-outline" size={22} color={colors.brand} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={22} color={colors.dangerText} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={dynamicStyles.fab} 
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={dynamicStyles.modalContainer}
        >
          <View style={dynamicStyles.modalContent}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>
                {editingStaff ? "Update Staff" : "Add New Staff"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>FULL NAME</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="Staff Member Name"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>EMAIL ADDRESS</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="email@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>PHONE NUMBER</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="10 digit mobile number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />

              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>ROLE</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                {["Admin", "Manager", "Sales Staff", "Inventory Manager"].map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    onPress={() => setRole(r)}
                    style={{
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                      borderRadius: radius.pill,
                      backgroundColor: role === r ? colors.brand : colors.surfaceMuted,
                      borderWidth: 1,
                      borderColor: role === r ? colors.brand : colors.border
                    }}
                  >
                    <Text style={{ color: role === r ? "white" : colors.textSecondary, fontSize: 12, fontWeight: "700" }}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>PASSWORD {editingStaff && "(Leave blank to keep current)"}</Text>
              <TextInput
                style={dynamicStyles.input}
                placeholder="Login Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <View style={{ marginTop: 10, marginBottom: 20 }}>
                  <Text style={{ color: colors.brand, fontWeight: "800", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 15 }}>Module Permissions</Text>
                  
                  {/* Permissions Header */}
                  <View style={{ flexDirection: "row", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Text style={{ width: 100, fontSize: 10, fontWeight: "800", color: colors.textMuted }}>MODULE</Text>
                      <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
                          <Text style={{ fontSize: 10, fontWeight: "800", color: colors.textMuted }}>VIEW</Text>
                          <Text style={{ fontSize: 10, fontWeight: "800", color: colors.textMuted }}>CREATE</Text>
                          <Text style={{ fontSize: 10, fontWeight: "800", color: colors.textMuted }}>EDIT</Text>
                          <Text style={{ fontSize: 10, fontWeight: "800", color: colors.textMuted }}>DELETE</Text>
                      </View>
                  </View>

                  {/* Permission Rows */}
                  {["invoices", "products", "inventory", "customers", "staff"].map((mod) => (
                      <View key={mod} style={dynamicStyles.permissionRow}>
                          <Text style={dynamicStyles.permissionLabel}>{mod.charAt(0).toUpperCase() + mod.slice(1)}</Text>
                          <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
                              {["view", "create", "edit", "delete"].map((act) => (
                                  <TouchableOpacity 
                                      key={act} 
                                      onPress={() => togglePermission(mod, act)}
                                      style={{ padding: 5 }}
                                  >
                                      <Ionicons 
                                          name={permissions[mod]?.[act] ? "checkbox" : "square-outline"} 
                                          size={22} 
                                          color={permissions[mod]?.[act] ? colors.brand : colors.textMuted} 
                                      />
                                  </TouchableOpacity>
                              ))}
                          </View>
                      </View>
                  ))}

                  {/* Analytics Row (View only) */}
                  <View style={dynamicStyles.permissionRow}>
                      <Text style={dynamicStyles.permissionLabel}>Analytics</Text>
                      <View style={{ flex: 1, flexDirection: "row", paddingRight: 45, justifyContent: "flex-end" }}>
                          <TouchableOpacity onPress={() => togglePermission("analytics", "view")} style={{ padding: 5 }}>
                              <Ionicons 
                                  name={permissions.analytics?.view ? "checkbox" : "square-outline"} 
                                  size={22} 
                                  color={permissions.analytics?.view ? colors.brand : colors.textMuted} 
                                />
                          </TouchableOpacity>
                      </View>
                  </View>
              </View>

              <TouchableOpacity 
                style={dynamicStyles.submitButton} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
                    {editingStaff ? "UPDATE RECORD" : "ADD STAFF MEMBER"}
                  </Text>
                )}
              </TouchableOpacity>
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
