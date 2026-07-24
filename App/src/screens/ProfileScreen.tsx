import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  Switch,
  Animated,
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius } from "../theme";
import { useTheme } from "../ThemeContext";
import { CustomAlert } from "../components/CustomAlert";
import { M3Switch } from "../components/M3Switch";
import { getStaffById, getDashboardData, updateStaff, clearApiCache } from "../api";
import { hasPermission } from "../utils/permissions";
import type { User } from "../types";

const { width } = Dimensions.get("window");

export function getRoleRingColor(role?: string): { color: string; label: string } {
  const normalized = (role || "").toLowerCase();
  if (normalized.includes("owner")) {
    return { color: "#FFD700", label: "Gold Business Ring" };
  }
  if (normalized.includes("manager")) {
    return { color: "#3B82F6", label: "Blue Management Ring" };
  }
  if (normalized.includes("cashier")) {
    return { color: "#10B981", label: "Emerald Operations Ring" };
  }
  if (normalized.includes("inventory")) {
    return { color: "#F59E0B", label: "Amber Warehouse Ring" };
  }
  if (normalized.includes("delivery")) {
    return { color: "#8B5CF6", label: "Purple Route Ring" };
  }
  if (normalized.includes("tailor")) {
    return { color: "#EC4899", label: "Pink Production Ring" };
  }
  if (normalized.includes("accountant")) {
    return { color: "#14B8A6", label: "Teal Finance Ring" };
  }
  return { color: "#8E94F2", label: "Standard Staff Ring" };
}

export function ProfileScreen({ user, onLogout, onUpdateUser, refreshSignal, onRefreshComplete }: { user: User, onLogout: () => void, onUpdateUser: (user: User) => void, refreshSignal?: number, onRefreshComplete?: () => void }) {
  const { colors, theme, toggleTheme } = useTheme();
  const [userData, setUserData] = useState<User>(user);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "danger" | "warning" | "info",
    showConfirm: false,
    onConfirm: () => {},
  });

  // Profile Data States
  const [email, setEmail] = useState(user?.email || "");
  const [isEmailUpdated, setIsEmailUpdated] = useState(!!user?.email);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const themeFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Animate when theme changes
  useEffect(() => {
    themeFade.setValue(0);
    Animated.timing(themeFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [theme]);

  useEffect(() => {
    fetchProfileData(false);
  }, []);

  useEffect(() => {
    if (refreshSignal && refreshSignal > 0) {
      fetchProfileData(true);
    }
  }, [refreshSignal]);

  const fetchProfileData = async (force = false) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profileRes, statsRes] = await Promise.all([
        getStaffById(user.id, force),
        getDashboardData(user.shopId, user.id, force)
      ]);

      if (profileRes && profileRes.success) {
        setUserData(profileRes.data);
        setEmail(profileRes.data.email || "");
        onUpdateUser(profileRes.data);
      }

      if (statsRes && statsRes.success) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
      if (onRefreshComplete) onRefreshComplete();
    }
  };

  const showAlert = (title: string, message: string, type: any = "info", showConfirm = false, onConfirm = () => {}) => {
    setAlertConfig({
        visible: true,
        title,
        message,
        type,
        showConfirm,
        onConfirm
    });
  };

  const hideAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerBackground: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 200,
      backgroundColor: colors.brand,
    },
    profileInfo: {
      alignItems: "center",
      marginTop: 120,
      paddingHorizontal: 20,
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: colors.surface,
      backgroundColor: colors.surfaceMuted,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: colors.surface,
        backgroundColor: colors.surfaceAccent,
        alignItems: "center",
        justifyContent: "center"
    },
    avatarText: {
        color: colors.white,
        fontSize: 32,
        fontWeight: "bold"
    },
    editIconContainer: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: colors.surface,
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userName: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.textPrimary,
    },
    userPhone: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: 2,
    },
    userEmail: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 1,
    },
    badgeRow: {
        flexDirection: "row",
        marginTop: 12,
    },
    badge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: radius.pill,
        marginHorizontal: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    section: {
        marginTop: 30,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: colors.textPrimary,
    },
    showAll: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    progressContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    progressItem: {
        alignItems: "center",
        width: "30%",
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 8,
    },
    progressCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 6,
        borderColor: colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
    },
    progressValue: {
        fontSize: 14,
        fontWeight: "800",
        color: colors.textPrimary,
    },
    noteCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: 16,
        width: width * 0.43,
        marginRight: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    noteDate: {
        fontSize: 10,
        color: colors.textMuted,
        marginBottom: 8,
    },
    noteText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary,
        lineHeight: 20,
    },
    configCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: colors.border,
    },
    configLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    configText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    logoutButton: {
        marginTop: 20,
        marginBottom: 40,
        marginHorizontal: 20,
        backgroundColor: colors.dangerBg,
        borderRadius: radius.lg,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    logoutText: {
        color: colors.dangerText,
        fontSize: 16,
        fontWeight: "700",
        marginLeft: 8,
    },
    emailInput: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginRight: 10
    },
    updateButton: {
        backgroundColor: colors.brand,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.sm,
    },
    updateButtonText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: "700"
    }
  });

  const handlePasswordReset = () => {
    showAlert("Password Reset", "A password reset link has been sent to your registered mobile number.", "info");
  };

  const handleLogout = () => {
    showAlert(
        "Logout",
        "Are you sure you want to logout?",
        "danger",
        true,
        () => {
          clearApiCache();
          onLogout();
        }
    );
  };

  const handleUpdateEmail = async () => {
    if (!email.includes("@")) {
        showAlert("Invalid Email", "Please enter a valid email address.", "warning");
        return;
    }
    
    try {
        const response = await updateStaff(user.id, { email });
        if (response && response.success) {
            showAlert("Success", "Email updated successfully!", "success");
            setIsEmailUpdated(true);
            fetchProfileData();
        } else {
            showAlert("Error", response?.message || "Failed to update email", "danger");
        }
    } catch (error) {
        showAlert("Error", String(error), "danger");
    }
  };

  const initials = userData?.fullName?.split(' ').map((n:any) => n[0]).join('') || "ST";

  return (
    <Animated.View style={[dynamicStyles.container, { opacity: themeFade }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[dynamicStyles.headerBackground, { transform: [{ scaleY: headerScale }] }]} />

        <Animated.View
          style={[
            dynamicStyles.profileInfo,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={dynamicStyles.avatarContainer}>
            <View style={[dynamicStyles.avatarPlaceholder, { borderColor: getRoleRingColor(userData?.role).color, borderWidth: 4 }]}>
                <Text style={dynamicStyles.avatarText}>{initials}</Text>
            </View>
            <View style={dynamicStyles.editIconContainer}>
                <Ionicons name="shield-checkmark" size={16} color={getRoleRingColor(userData?.role).color} />
            </View>
          </View>

          <Text style={dynamicStyles.userName}>{userData?.fullName || "Staff Member"}</Text>
          <Text style={dynamicStyles.userPhone}>{userData?.phoneNumber || "No Mobile Number"}</Text>
          {userData?.email ? (
            <Text style={dynamicStyles.userEmail}>{userData.email.toLowerCase()}</Text>
          ) : null}

          <View style={dynamicStyles.badgeRow}>
              <View style={[dynamicStyles.badge, { backgroundColor: getRoleRingColor(userData?.role).color }]}>
                  <Text style={[dynamicStyles.badgeText, { color: colors.white }]}>★ {userData?.role?.toUpperCase() || "STAFF"}</Text>
              </View>
              <View style={[dynamicStyles.badge, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[dynamicStyles.badgeText, { color: colors.brand }]}>{userData?.branch?.toUpperCase() || "MAIN BRANCH"}</Text>
              </View>
          </View>
          <Text style={{ fontSize: 11, fontWeight: "700", color: getRoleRingColor(userData?.role).color, marginTop: 6 }}>
            {getRoleRingColor(userData?.role).label}
          </Text>
        </Animated.View>

        {/* Complete Profile Section - Conditional Rendering */}
        {!userData?.email && !isEmailUpdated && (
            <Animated.View style={[dynamicStyles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Text style={[dynamicStyles.sectionTitle, { marginBottom: 16 }]}>Complete Your Profile</Text>
                <View style={dynamicStyles.configCard}>
                    <View style={dynamicStyles.configLeft}>
                        <View style={dynamicStyles.iconBox}>
                            <Ionicons name="mail" size={20} color={colors.brand} />
                        </View>
                        <TextInput
                            style={dynamicStyles.emailInput}
                            placeholder="Enter your email"
                            placeholderTextColor={colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    <Pressable style={dynamicStyles.updateButton} onPress={handleUpdateEmail}>
                        <Text style={dynamicStyles.updateButtonText}>UPDATE</Text>
                    </Pressable>
                </View>
            </Animated.View>
        )}

        {/* Performance Stats section */}
        {hasPermission(userData, "analytics.view") && (
            <Animated.View style={[dynamicStyles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={dynamicStyles.sectionHeader}>
                    <Text style={dynamicStyles.sectionTitle}>Performance Stats</Text>
                    <Text style={dynamicStyles.showAll}>this month ⌵</Text>
                </View>
                <View style={dynamicStyles.progressContainer}>
                    <View style={dynamicStyles.progressItem}>
                        <Text style={[dynamicStyles.progressLabel, { color: colors.brand }]}>Orders</Text>
                        <View style={[dynamicStyles.progressCircle, { borderColor: colors.brand + "40", borderTopColor: colors.brand }]}>
                            <Text style={dynamicStyles.progressValue}>{stats?.totalOrders || 0}</Text>
                        </View>
                    </View>
                    <View style={dynamicStyles.progressItem}>
                        <Text style={[dynamicStyles.progressLabel, { color: "#4CD964" }]}>Sales</Text>
                        <View style={[dynamicStyles.progressCircle, { borderColor: "#4CD96440", borderTopColor: "#4CD964" }]}>
                            <Text style={dynamicStyles.progressValue}>₹{stats?.totalRevenue ? (stats.totalRevenue > 1000 ? (stats.totalRevenue/1000).toFixed(1) + 'k' : stats.totalRevenue) : 0}</Text>
                        </View>
                    </View>
                    <View style={dynamicStyles.progressItem}>
                        <Text style={[dynamicStyles.progressLabel, { color: "#007AFF" }]}>Earned</Text>
                        <View style={[dynamicStyles.progressCircle, { borderColor: "#007AFF40", borderTopColor: "#007AFF" }]}>
                            <Text style={dynamicStyles.progressValue}>₹{userData?.commissionEarned || 0}</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        )}

        {/* App Settings Section */}
        <Animated.View style={[dynamicStyles.section, { marginTop: 40, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[dynamicStyles.sectionTitle, { marginBottom: 16 }]}>App Settings</Text>

            <View style={dynamicStyles.configCard}>
                <View style={dynamicStyles.configLeft}>
                    <View style={dynamicStyles.iconBox}>
                        <Ionicons name={theme === "dark" ? "moon" : "sunny"} size={20} color={colors.brand} />
                    </View>
                    <Text style={dynamicStyles.configText}>Dark Mode</Text>
                </View>
                <M3Switch
                  value={theme === "dark"}
                  onValueChange={toggleTheme}
                />
            </View>

            <Pressable style={dynamicStyles.configCard} onPress={handlePasswordReset}>
                <View style={dynamicStyles.configLeft}>
                    <View style={dynamicStyles.iconBox}>
                        <Ionicons name="lock-closed" size={20} color={colors.brand} />
                    </View>
                    <Text style={dynamicStyles.configText}>Reset Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable style={dynamicStyles.configCard}>
                <View style={dynamicStyles.configLeft}>
                    <View style={dynamicStyles.iconBox}>
                        <Ionicons name="notifications" size={20} color={colors.brand} />
                    </View>
                    <Text style={dynamicStyles.configText}>Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
        </Animated.View>

        {/* Account Details Section */}
        <Animated.View style={[dynamicStyles.section, { marginBottom: 20, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>Account Details</Text>
            </View>
            <View style={dynamicStyles.configCard}>
                <View style={dynamicStyles.configLeft}>
                    <View style={dynamicStyles.iconBox}>
                        <Ionicons name="call" size={20} color={colors.brand} />
                    </View>
                    <View>
                        <Text style={[dynamicStyles.configText, { fontSize: 14 }]}>Phone Number</Text>
                        <Text style={{ color: colors.textSecondary }}>{userData?.phoneNumber || "Not provided"}</Text>
                    </View>
                </View>
            </View>
            <View style={dynamicStyles.configCard}>
                <View style={dynamicStyles.configLeft}>
                    <View style={dynamicStyles.iconBox}>
                        <Ionicons name="business" size={20} color={colors.brand} />
                    </View>
                    <View>
                        <Text style={[dynamicStyles.configText, { fontSize: 14 }]}>Branch</Text>
                        <Text style={{ color: colors.textSecondary }}>{userData?.branch || "Main Branch"}</Text>
                    </View>
                </View>
            </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Pressable style={dynamicStyles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out" size={20} color={colors.dangerText} />
                <Text style={dynamicStyles.logoutText}>Log Out</Text>
            </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Custom Theme-Based Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showConfirm={alertConfig.showConfirm}
        onConfirm={alertConfig.onConfirm}
        onClose={hideAlert}
      />
    </Animated.View>
  );
}
