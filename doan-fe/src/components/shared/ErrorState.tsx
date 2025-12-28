import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../styles/theme";

export default function ErrorState({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: theme.colors.dangerBg, borderColor: "#FCA5A5", borderWidth: 1, borderRadius: theme.radius.xl, padding: theme.spacing.md },
  text: { color: theme.colors.danger, fontWeight: "600" },
});
