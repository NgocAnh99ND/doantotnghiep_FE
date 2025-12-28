import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { theme } from "../../styles/theme";

export default function AppButton({
  title,
  onPress,
  disabled,
  variant = "primary",
  style,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  style?: ViewStyle;
}) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.text, isPrimary ? styles.primaryText : styles.ghostText, disabled ? styles.disabledText : null]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: theme.radius.xl, paddingVertical: 12, paddingHorizontal: theme.spacing.md },
  primary: { backgroundColor: theme.colors.primary },
  ghost: { backgroundColor: "transparent" },
  disabled: { backgroundColor: theme.colors.disabled },
  text: { textAlign: "center", fontWeight: "700", fontSize: 15 },
  primaryText: { color: theme.colors.primaryText },
  ghostText: { color: theme.colors.subtext },
  disabledText: { color: "#4B5563" },
});
