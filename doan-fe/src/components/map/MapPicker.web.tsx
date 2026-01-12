import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { theme } from "@/styles/theme";
import { AppText } from "@/components";

type LatLng = { latitude: number; longitude: number };

export default function MapPicker({
  height = 260,
  startCoord,
  endCoord,
  onPress,
}: {
  height?: number;
  region: any; // web fallback ignore
  showsUserLocation?: boolean;
  startCoord?: LatLng | null;
  endCoord?: LatLng | null;
  startTitle?: string;
  endTitle?: string;
  startDesc?: string;
  endDesc?: string;
  onPress: (coord: LatLng) => void;
}) {
  const fakeTap = () => {
    const latitude = 10.8231 + (Math.random() - 0.5) * 0.02;
    const longitude = 106.6297 + (Math.random() - 0.5) * 0.02;
    onPress({ latitude, longitude });
  };

  return (
    <Pressable onPress={fakeTap} style={[styles.wrap, { height }]}>
      <View style={styles.inner}>
        <AppText style={styles.title}>Map (Web fallback)</AppText>
        <AppText style={styles.sub}>
          react-native-maps không chạy trên Web. Click để chọn điểm (giả lập).
        </AppText>

        <View style={{ height: 10 }} />

        <AppText style={styles.sub}>
          Start: {startCoord ? `${startCoord.latitude.toFixed(5)}, ${startCoord.longitude.toFixed(5)}` : "-"}
        </AppText>
        <AppText style={styles.sub}>
          End: {endCoord ? `${endCoord.latitude.toFixed(5)}, ${endCoord.longitude.toFixed(5)}` : "-"}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  inner: { flex: 1, alignItems: "center", justifyContent: "center", padding: 14, gap: 6 },
  title: { fontSize: 16, fontWeight: "900" },
  sub: { fontSize: 13, opacity: 0.75, textAlign: "center" },
});
