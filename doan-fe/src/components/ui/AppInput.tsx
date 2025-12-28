import React from "react";
import { View, TextInput, StyleSheet, Text, TextInputProps } from "react-native";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";

export default function AppInput({ label, style, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={styles.wrap}>
      {!!label && <Text style={typography.sub}>{label}</Text>}
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor={theme.colors.subtext}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  input: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
  },
});
