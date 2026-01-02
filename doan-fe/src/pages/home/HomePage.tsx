import React from "react";
import { StyleSheet, View, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { Screen, AppText, Divider } from "@/components";
import { theme } from "@/styles/theme";

export default function HomePage() {
  const router = useRouter();

  const [startLocation, setStartLocation] = React.useState("");
  const [endLocation, setEndLocation] = React.useState("");

  const onSearch = () => {
    // Tuỳ bạn: push sang routes và truyền params
    // Ví dụ: /(tabs)/routes?start=...&end=...
    router.push({
      pathname: "/(tabs)/routes",
      params: {
        start: startLocation.trim(),
        end: endLocation.trim(),
      },
    } as any);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText style={styles.h1}>Tiện Chuyến</AppText>
        <AppText style={styles.sub}>Nhập điểm đi và điểm đến để tìm tuyến phù hợp</AppText>
      </View>

      {/* MAP */}

      {/* INPUTS */}
      <View style={styles.form}>
        <AppText style={styles.sectionTitle}>Điểm đi / Điểm đến</AppText>

        <TextInput
          value={startLocation}
          onChangeText={setStartLocation}
          placeholder="Điểm đi (start_location)"
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          value={endLocation}
          onChangeText={setEndLocation}
          placeholder="Điểm đến (end_location)"
          style={styles.input}
          autoCapitalize="none"
        />

        <Pressable
          onPress={onSearch}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          disabled={!startLocation.trim() || !endLocation.trim()}
        >
          <AppText style={styles.primaryBtnText}>Tìm tuyến</AppText>
        </Pressable>
      </View>

      <Divider />

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Gợi ý nhanh</AppText>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <AppText style={styles.pillText}>Tuyến gần bạn</AppText>
          </View>
          <View style={styles.pill}>
            <AppText style={styles.pillText}>Giá tốt</AppText>
          </View>
          <View style={styles.pill}>
            <AppText style={styles.pillText}>Giờ khởi hành sớm</AppText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Hoạt động gần đây</AppText>
        <View style={styles.listItem}>
          <AppText style={styles.listTitle}>Bạn chưa có hoạt động</AppText>
          <AppText style={styles.listSub}>Tạo yêu cầu hoặc tìm tuyến để bắt đầu.</AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6, paddingBottom: 12 },
  h1: { fontSize: 26, fontWeight: "700" },
  sub: { fontSize: 14, opacity: 0.7 },

  mapWrap: {
    height: 240,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },

  // nếu dùng placeholder
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  form: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    gap: 10,
  },

  section: { marginTop: 14, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  primaryBtn: {
    marginTop: 2,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    backgroundColor: "#111",
  },
  primaryBtnText: { fontWeight: "800", color: "#fff" },

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillText: { fontSize: 12, opacity: 0.8 },

  listItem: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  listTitle: { fontSize: 14, fontWeight: "700" },
  listSub: { fontSize: 13, opacity: 0.7, marginTop: 4 },
});
