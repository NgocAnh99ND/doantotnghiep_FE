import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";

export default function Loading() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center" },
});
