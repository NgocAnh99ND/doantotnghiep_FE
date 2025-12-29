import React from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "@/styles/theme";

export default function Divider() {
    return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
    divider: { height: 1, backgroundColor: theme.colors.border, marginTop: 16 },
});
