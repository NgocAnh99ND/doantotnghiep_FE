import React from "react";
import { Text, StyleSheet } from "react-native";
import Screen from "../components/ui/Screen";
import { theme } from "../styles/theme";

export default function NotFound() {
  return (
    <Screen>
      <Text style={styles.h1}>404</Text>
      <Text style={styles.sub}>Không tìm thấy trang</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: "900", color: theme.colors.text },
  sub: { color: theme.colors.subtext },
});
