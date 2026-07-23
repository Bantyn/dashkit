import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Pressable,
  Animated,
  View,
} from "react-native";
import { useTheme } from "../ThemeContext";

interface M3SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function M3Switch({ value, onValueChange, disabled }: M3SwitchProps) {
  const { colors } = useTheme();

  // Animation Values
  const translateX = useRef(new Animated.Value(value ? 20 : 0)).current;
  const thumbSize = useRef(new Animated.Value(value ? 24 : 16)).current;
  const trackColorAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: value ? 20 : 0,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }),
      Animated.spring(thumbSize, {
        toValue: value ? 24 : 16,
        useNativeDriver: false,
        friction: 8,
      }),
      Animated.timing(trackColorAnim, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value]);

  const trackColor = trackColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surfaceMuted, colors.brand],
  });

  const borderColor = trackColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.brand],
  });

  const thumbColor = trackColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textSecondary, colors.white],
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={({ pressed }) => [
        styles.trackBase,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: trackColor,
            borderColor: borderColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
              width: thumbSize,
              height: thumbSize,
              backgroundColor: thumbColor,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trackBase: {
    width: 52,
    height: 32,
    justifyContent: "center",
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  thumb: {
    borderRadius: 12,
  },
});
