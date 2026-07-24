import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  StatusBar,
  Animated,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Svg, { Path } from "react-native-svg";

import { DashboardScreen } from "./screens/DashboardScreen";
import { POSScreen } from "./screens/POSScreen";
import { OrdersScreen } from "./screens/OrdersScreen";
import { InventoryScreen } from "./screens/InventoryScreen";
import { CustomersScreen } from "./screens/CustomersScreen";
import { ProductsScreen } from "./screens/ProductsScreen";
import { StaffManagementScreen } from "./screens/StaffManagementScreen";
import { DeliveryScreen } from "./screens/DeliveryScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { GettingStartedScreen } from "./screens/GettingStartedScreen";
import type { TabKey, User } from "./types";
import { useTheme } from "./ThemeContext";
import { getAvailableTabs } from "./utils/permissions";
import { ProtectedScreen } from "./components/ProtectedScreen";
import { setApiStaffId, setApiToken } from "./api";

const { width, height } = Dimensions.get("window");

const getIconName = (key: TabKey): any => {
  switch (key) {
    case "dashboard": return "home";
    case "delivery": return "map";
    case "orders": return "receipt";
    case "products": return "shirt";
    case "inventory": return "cube";
    case "customers": return "people";
    case "pos": return "add";
    case "staff": return "shield-checkmark";
    default: return "help-circle";
  }
};

export function StaffApp() {
  const { colors, theme } = useTheme();
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setRefreshSignal(prev => prev + 1);
    // Auto reset refreshing after 2 seconds to ensure spinner disappears even if child fails
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  useEffect(() => {
    setApiStaffId(user?.id || null);
    setApiToken(user?.token || null);
  }, [user]);

  // Animations
  const screenFade = useRef(new Animated.Value(0)).current;
  const screenSlide = useRef(new Animated.Value(20)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Custom Tab Animations
  const tabPosition = useRef(new Animated.Value(0)).current;

  const availableTabs = useMemo(() => {
    if (!user || !user.permissions) return [{ key: "dashboard", label: "Home" }];
    return getAvailableTabs(user);
  }, [user]);

  const activeIndex = useMemo(() => {
    return availableTabs.findIndex(t => t.key === activeTab);
  }, [availableTabs, activeTab]);

  useEffect(() => {
    // If activeTab is not in availableTabs (hidden manager sub-screens), move circle far left/off-screen
    const targetValue = activeIndex === -1 ? -1 : activeIndex;

    Animated.spring(tabPosition, {
      toValue: targetValue,
      useNativeDriver: true,
      friction: 10,
      tension: 50
    }).start();
  }, [activeIndex]);

  useEffect(() => {
    if (user && !showGettingStarted) {
      screenFade.setValue(0);
      screenSlide.setValue(15);

      Animated.parallel([
        Animated.timing(screenFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(screenSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [activeTab, user, showGettingStarted]);

  if (showGettingStarted) {
    return <GettingStartedScreen onComplete={() => setShowGettingStarted(false)} />;
  }

  if (!user) {
    return <LoginScreen onLogin={(userData) => setUser(userData)} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardScreen onJump={setActiveTab} user={user} refreshSignal={refreshSignal} onRefreshComplete={() => setRefreshing(false)} />;
      case "delivery":
        return (
          <ProtectedScreen user={user} permission="delivery.view">
            <DeliveryScreen user={user} />
          </ProtectedScreen>
        );
      case "pos":
        return (
          <ProtectedScreen user={user} permission="invoices.view">
            <POSScreen user={user} />
          </ProtectedScreen>
        );
      case "orders":
        return (
          <ProtectedScreen user={user} permission="invoices.view">
            <OrdersScreen user={user} refreshSignal={refreshSignal} onRefreshComplete={() => setRefreshing(false)} />
          </ProtectedScreen>
        );
      case "inventory":
        return (
          <ProtectedScreen user={user} permission="inventory.view">
            <InventoryScreen user={user} refreshSignal={refreshSignal} onRefreshComplete={() => setRefreshing(false)} />
          </ProtectedScreen>
        );
      case "products":
        return (
          <ProtectedScreen user={user} permission="products.view">
            <ProductsScreen user={user} refreshSignal={refreshSignal} onRefreshComplete={() => setRefreshing(false)} />
          </ProtectedScreen>
        );
      case "customers":
        return (
          <ProtectedScreen user={user} permission="customers.view">
            <CustomersScreen user={user} refreshSignal={refreshSignal} onRefreshComplete={() => setRefreshing(false)} />
          </ProtectedScreen>
        );
      case "staff":
        return (
          <ProtectedScreen user={user} permission="staff.view">
            <StaffManagementScreen user={user} refreshSignal={refreshSignal} onRefreshComplete={() => setRefreshing(false)} />
          </ProtectedScreen>
        );
      case "profile":
        return <ProfileScreen user={user} onLogout={() => setUser(null)} onUpdateUser={(userData) => setUser(userData)} refreshSignal={refreshSignal} onRefreshComplete={() => setRefreshing(false)} />;
      default:
        return null;
    }
  };

  const BAR_WIDTH = width * 0.94;
  const TAB_WIDTH = BAR_WIDTH / availableTabs.length;
  const CURVE_WIDTH = 90; // Adjusted for smaller circle
  const CURVE_DEPTH = 35; // Adjusted depth for smaller circle

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    headerBg: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 320,
      backgroundColor: colors.brandStrong,
      borderBottomLeftRadius: 100,
      borderBottomRightRadius: 100,
      zIndex: 0,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 50,
      paddingBottom: 20,
      zIndex: 2
    },
    title: {
      color: colors.white,
      fontSize: 22,
      fontWeight: "800",
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 25,
      backgroundColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 0.5,
      borderColor: "rgba(255,255,255,0.4)"
    },
    avatarText: {
      color: colors.white,
      fontWeight: "800",
      fontSize: 18
    },
    content: {
      flex: 1,
      zIndex: 1
    },
    contentScroll: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 140
    },
    bottomBarContainer: {
      position: "absolute",
      bottom: 25,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 10
    },
    bottomBar: {
      width: BAR_WIDTH,
      height: 70,
      backgroundColor: "transparent",
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
    },
    tabText: {
      fontSize: 11,
      fontWeight: "700",
    },
    floatingCircle: {
      position: "absolute",
      top: -28,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.brand + "30",
      elevation: 0,
      overflow: "hidden"
    },
    circleInner: {
      width: 40,
      height: 44,
      borderRadius: 20,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    }
  });

  const generatePath = () => {
    const center = (activeIndex * TAB_WIDTH) + (TAB_WIDTH / 2);
    const left = center - (CURVE_WIDTH / 2);
    const right = center + (CURVE_WIDTH / 2);

    return `
      M 25 0
      L ${left} 0
      C ${left + 15} 0, ${left + 10} ${CURVE_DEPTH}, ${center} ${CURVE_DEPTH}
      C ${right - 10} ${CURVE_DEPTH}, ${right - 15} 0, ${right} 0
      L ${BAR_WIDTH - 25} 0
      Q ${BAR_WIDTH} 0, ${BAR_WIDTH} 25
      L ${BAR_WIDTH} 45
      Q ${BAR_WIDTH} 70, ${BAR_WIDTH - 25} 70
      L 25 70
      Q 0 70, 0 45
      L 0 25
      Q 0 0, 25 0
      Z
    `;
  };

  const blurOpacity = scrollY.interpolate({
    inputRange: [0, height * 0.3],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={dynamicStyles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {activeTab !== "profile" && (
        <View style={dynamicStyles.headerBg}>
          <View style={{ ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 100, borderBottomRightRadius: 100, overflow: "hidden" }}>
            <BlurView intensity={6.9} tint={theme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          </View>
        </View>
      )}

      {activeTab !== "profile" && (
        <View style={dynamicStyles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {activeIndex === -1 && activeTab !== "dashboard" && (
              <Pressable onPress={() => setActiveTab("dashboard")} style={{ marginRight: 12 }}>
                <Ionicons name="arrow-back" size={28} color="white" />
              </Pressable>
            )}
            <View>
              <Text style={dynamicStyles.title}>{user?.shopName || "Dashkit"}</Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" }}>{user?.branch ? `${user.branch}` : "Operations Management"}</Text>
            </View>
          </View>
          <Pressable onPress={() => setActiveTab("profile")} style={dynamicStyles.avatar}>
            <Text style={dynamicStyles.avatarText}>{user?.fullName?.split(' ').map((n: any) => n[0]).join('') || "NF"}</Text>
          </Pressable>
        </View>
      )}

      <Animated.View style={[dynamicStyles.content, { opacity: screenFade, transform: [{ translateY: screenSlide }] }]}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          contentContainerStyle={[dynamicStyles.contentScroll, activeTab === "profile" && { paddingHorizontal: 0, paddingTop: 0 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.brand]}
              progressViewOffset={80} // Offset so it's not hidden behind the curved header
              tintColor={colors.brand}
            />
          }
        >
          {renderScreen()}
        </Animated.ScrollView>
      </Animated.View>

      <View style={dynamicStyles.bottomBarContainer}>
        <View style={dynamicStyles.bottomBar}>
          <Svg width={BAR_WIDTH} height={70}>
            <Path d={generatePath()} fill={colors.surface} />
          </Svg>

          <View style={[StyleSheet.absoluteFill, { flexDirection: "row" }]}>
            <Animated.View
              style={[
                dynamicStyles.floatingCircle,
                {
                  left: 0,
                  transform: [
                    {
                      translateX: tabPosition.interpolate({
                        inputRange: availableTabs.length > 1 ? availableTabs.map((_, i) => i) : [0, 1],
                        outputRange: availableTabs.length > 1
                          ? availableTabs.map((_, i) => (i * TAB_WIDTH) + (TAB_WIDTH / 2) - 28)
                          : [(TAB_WIDTH / 2) - 28, (TAB_WIDTH / 2) - 28] // Fallback for 1 tab
                      })
                    }
                  ]
                }
              ]}
            >
              <BlurView
                intensity={20.9}
                tint={theme === "dark" ? "dark" : "light"}
                style={[StyleSheet.absoluteFill, { backgroundColor: theme === "dark" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)" }]}
              />
              <View style={dynamicStyles.circleInner}>
                <Ionicons name={getIconName(activeTab)} size={26} color={colors.brand} />
              </View>
            </Animated.View>

            {availableTabs.map((tab, index) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable key={tab.key} onPress={() => setActiveTab(tab.key as TabKey)} style={dynamicStyles.tabItem}>
                  {!isActive && <Ionicons name={(getIconName(tab.key as TabKey) + "-outline") as any} size={24} color={colors.textMuted} />}
                  <Text style={[
                    dynamicStyles.tabText,
                    { color: isActive ? colors.brand : colors.textMuted, marginTop: isActive ? 42 : 4 }
                  ]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
