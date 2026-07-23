import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { hasPermission } from "../utils/permissions";
import { User } from "../types";

interface ProtectedScreenProps {
  user: User | null;
  permission: string;
  children: React.ReactNode;
}

export function ProtectedScreen({ user, permission, children }: ProtectedScreenProps) {
  const { colors } = useTheme();

  if (!hasPermission(user, permission)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={80} color={colors.dangerText} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Access Denied</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          You do not have permission to view this screen. Please contact your administrator.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
