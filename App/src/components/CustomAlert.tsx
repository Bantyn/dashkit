import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { radius } from "../theme";
import { getResponsiveFontSize, getPlatformPadding } from "../utils/responsive";

const { width, height } = Dimensions.get("window");

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "danger" | "warning" | "info";
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showConfirm?: boolean;
}

export function CustomAlert({
  visible,
  title,
  message,
  type = "info",
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  showConfirm = false
}: CustomAlertProps) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case "success": return "checkmark-circle";
      case "danger": return "alert-circle";
      case "warning": return "warning";
      default: return "information-circle";
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case "success": return colors.successText;
      case "danger": return colors.dangerText;
      case "warning": return colors.warningText;
      default: return colors.brand;
    }
  };

  const dynamicStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    alertBox: {
      width: Math.min(width * 0.88, 400),
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: getPlatformPadding(24, 20),
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.22,
          shadowRadius: 18,
        },
        android: {
          elevation: 10,
        },
        web: {
          boxShadow: "0px 10px 30px rgba(0,0,0,0.2)",
        }
      })
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: getTypeColor() + "15",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: getResponsiveFontSize(18),
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: "center"
    },
    message: {
      fontSize: getResponsiveFontSize(13),
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: getResponsiveFontSize(18),
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: "row",
      width: "100%",
    },
    button: {
      flex: 1,
      paddingVertical: getPlatformPadding(13, 11),
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButton: {
      backgroundColor: colors.surfaceMuted,
      marginRight: showConfirm ? 10 : 0,
    },
    confirmButton: {
      backgroundColor: getTypeColor(),
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: getResponsiveFontSize(14),
    },
    confirmButtonText: {
      color: colors.white,
      fontWeight: "800",
      fontSize: getResponsiveFontSize(14),
    }
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={dynamicStyles.overlay}>
        <Animated.View
          style={[
            dynamicStyles.alertBox,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={dynamicStyles.iconContainer}>
            <Ionicons name={getIcon()} size={40} color={getTypeColor()} />
          </View>

          <Text style={dynamicStyles.title}>{title}</Text>
          <Text style={dynamicStyles.message}>{message}</Text>

          <View style={dynamicStyles.buttonContainer}>
            <Pressable
              style={[dynamicStyles.button, dynamicStyles.cancelButton]}
              onPress={onClose}
            >
              <Text style={dynamicStyles.cancelButtonText}>{showConfirm ? cancelText : "Dismiss"}</Text>
            </Pressable>

            {showConfirm && (
              <Pressable
                style={[dynamicStyles.button, dynamicStyles.confirmButton]}
                onPress={() => {
                  onConfirm?.();
                  onClose();
                }}
              >
                <Text style={dynamicStyles.confirmButtonText}>{confirmText}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
