import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  Animated,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { radius } from "../theme";

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
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    alertBox: {
      width: width * 0.85,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: 24,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 10,
    },
    iconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: getTypeColor() + "15",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: 10,
      textAlign: "center"
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
    },
    buttonContainer: {
      flexDirection: "row",
      width: "100%",
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButton: {
      backgroundColor: colors.surfaceMuted,
      marginRight: showConfirm ? 12 : 0,
    },
    confirmButton: {
      backgroundColor: getTypeColor(),
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 16,
    },
    confirmButtonText: {
      color: colors.white,
      fontWeight: "800",
      fontSize: 16,
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
