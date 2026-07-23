import React from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "./src/ThemeContext";
import { StaffApp } from "./src/StaffApp";

function AppContent() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <StaffApp />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
