import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Screen from "../components/ui/Screen";
import { theme } from "../styles/theme";
import { typography } from "../styles/typography";

export default function MainLayout({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={typography.h2}>{title}</Text>
      </View>
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: theme.spacing.sm },
});
