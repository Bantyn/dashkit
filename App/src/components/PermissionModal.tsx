import React from "react";
import { Modal, StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { radius } from "../theme";

interface PermissionModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function PermissionModal({
  visible,
  onClose,
  title = "Access Restricted",
  message = "You do not have permission to perform this action. Please contact your Shop Owner or Administrator.",
}: PermissionModalProps) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    title: {
      color: colors.textPrimary,
    },
    message: {
      color: colors.textSecondary,
    },
    button: {
      backgroundColor: colors.brand,
    },
    buttonText: {
      color: colors.white,
    },
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, dynamicStyles.card]}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={32} color="#EF4444" />
          </View>

          <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>
          <Text style={[styles.message, dynamicStyles.message]}>{message}</Text>

          <Pressable style={[styles.button, dynamicStyles.button]} onPress={onClose}>
            <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Understand</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: radius.lg,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
