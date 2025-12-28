import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Screen from "../components/ui/Screen";
import { typography } from "../styles/typography";
import { theme } from "../styles/theme";

export default function AuthLayout({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={typography.h1}>{title}</Text>
        <Text style={typography.sub}>Tiện Chuyến</Text>
      </View>
      <View style={styles.card}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: theme.spacing.lg, gap: 6 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: theme.spacing.md, gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
});
