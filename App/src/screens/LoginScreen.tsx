import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { radius } from "../theme";
import { loginStaff } from "../api";
import { CustomAlert } from "../components/CustomAlert";

const { width, height } = Dimensions.get("window");

export function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const { colors } = useTheme();
  const [identifier, setIdentifier] = useState(""); // Email or Mobile
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "danger" | "warning" | "info"
  });

  // Success Animation Values
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const validate = () => {
    let valid = true;
    let newErrors: { identifier?: string; password?: string } = {};

    if (!identifier) {
      newErrors.identifier = "Please enter email or mobile number";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // In the backend, we updated the login to accept 'identifier'
      // But the api.ts loginStaff might still be using (email, password)
      // Let's ensure it's flexible.
      const response = await loginStaff(identifier, password);

      // response format: { success: true, data: { profile: { ... }, id: "..." }, message: "...", token: "..." }
      const userData = {
        ...response.data.profile,
        id: response.data.id,
        token: response.token
      };

      // If successful, show success animation
      setIsSuccess(true);
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start(() => {
        // After animation, delay slightly and then redirect
        setTimeout(() => {
          onLogin(userData);
        }, 1500);
      });

    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Login Failed",
        message: String(error),
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    headerBg: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: height * 0.4,
      backgroundColor: colors.brand,
      borderBottomLeftRadius: 60,
      borderBottomRightRadius: 60,
    },
    headerContent: {
      height: height * 0.4,
      justifyContent: "center",
      paddingHorizontal: 30,
      paddingTop: StatusBar.currentHeight || 0,
    },
    welcomeTitle: {
      fontSize: 42,
      fontWeight: "800",
      color: colors.white,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.8)",
      marginTop: 8,
    },
    scrollContent: {
      flexGrow: 1,
    },
    formContainer: {
      paddingHorizontal: 30,
      paddingTop: 40,
      paddingBottom: 60,
      backgroundColor: colors.surface,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    input: {
      borderBottomWidth: 1.5,
      borderColor: colors.border,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.textPrimary,
    },
    inputError: {
      borderColor: colors.dangerText,
    },
    errorText: {
      color: colors.dangerText,
      fontSize: 12,
      marginTop: 4,
    },
    forgotPassword: {
      alignSelf: "flex-end",
      marginBottom: 32,
    },
    forgotPasswordText: {
      color: colors.brand,
      fontSize: 14,
      fontWeight: "600",
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
    },
    // signupButton: {
    //   paddingVertical: 14,
    //   paddingHorizontal: 24,
    //   borderRadius: radius.pill,
    //   borderWidth: 1,
    //   borderColor: colors.brand,
    // },
    // signupButtonText: {
    //   color: colors.brand,
    //   fontSize: 16,
    //   fontWeight: "700",
    // },
    loginButton: {
      // backgroundColor: colors.brand,
      paddingVertical: 16,
      paddingHorizontal: 40,
      borderRadius: radius.pill,
      shadowColor: colors.brand,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
      minWidth: 120,
      alignItems: "center",
      justifyContent: "center",
      borderColor: colors.brand,
      borderWidth: 2,
    },
    loginButtonText: {
      color: colors.brand,
      fontSize: 18,
      fontWeight: "800",
    },
    successOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.brand,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
    },
    successIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    successText: {
      color: colors.white,
      fontSize: 28,
      fontWeight: "800",
      textAlign: "center"
    },
    successSub: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 16,
      marginTop: 10
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={dynamicStyles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {isSuccess && (
        <Animated.View style={[dynamicStyles.successOverlay, { opacity: successOpacity }]}>
          <Animated.View style={[dynamicStyles.successIconContainer, { transform: [{ scale: successScale }] }]}>
            <Ionicons name="checkmark-done" size={80} color={colors.white} />
          </Animated.View>
          <Text style={dynamicStyles.successText}>Welcome Back!</Text>
          <Text style={dynamicStyles.successSub}>Login Successful</Text>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={dynamicStyles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.headerBg}>
            <View style={dynamicStyles.headerContent}>
                <Text style={dynamicStyles.welcomeTitle}>Welcome</Text>
                <Text style={dynamicStyles.welcomeSubtitle}>Sign in to your Staff Account</Text>
            </View>
        </View>

        <View style={{ height: height * 0.4 }} />

        <View style={dynamicStyles.formContainer}>
          <Text style={dynamicStyles.title}>Sign In</Text>
          <Text style={dynamicStyles.subtitle}>Enter your email or mobile to access the store</Text>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Email or Mobile Number</Text>
            <TextInput
              style={[dynamicStyles.input, errors.identifier ? dynamicStyles.inputError : null]}
              placeholder="email@example.com / 9876543210"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (errors.identifier) setErrors({ ...errors, identifier: undefined });
              }}
            />
            {errors.identifier && <Text style={dynamicStyles.errorText}>{errors.identifier}</Text>}
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Password</Text>
            <TextInput
              style={[dynamicStyles.input, errors.password ? dynamicStyles.inputError : null]}
              placeholder="********"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
            />
            {errors.password && <Text style={dynamicStyles.errorText}>{errors.password}</Text>}
          </View>

          <Pressable style={dynamicStyles.forgotPassword}>
            <Text style={dynamicStyles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>

          <View style={dynamicStyles.buttonRow}>
            {/* <Pressable style={dynamicStyles.signupButton}>
                <Text style={dynamicStyles.signupButtonText}>SIGN UP</Text>
            </Pressable> */}

            <Pressable
              disabled={loading}
              style={({ pressed }) => [
                dynamicStyles.loginButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                loading && { opacity: 0.7 }
              ]}
              onPress={handleLogin}
            >
              {loading ? (
                <ActivityIndicator color={colors.brand} />
              ) : (
                <Text style={dynamicStyles.loginButtonText}>SIGN IN</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}
