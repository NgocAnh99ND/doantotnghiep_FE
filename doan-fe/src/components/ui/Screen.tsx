import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, StyleSheet, ViewProps } from "react-native";
import { theme } from "../../styles/theme";

export default function Screen({ children, style, scroll }: React.PropsWithChildren<{ style?: ViewProps["style"]; scroll?: boolean }>) {
  const content = <View style={[styles.container, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { flexGrow: 1 },
  container: { flex: 1, padding: theme.spacing.md, gap: theme.spacing.md },
});
