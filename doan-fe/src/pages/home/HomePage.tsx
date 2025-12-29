import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Screen, AppText, Divider } from "@/components";
import { theme } from "@/styles/theme";

type QuickActionProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

function QuickAction({ title, subtitle, onPress }: QuickActionProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <AppText style={styles.cardTitle}>{title}</AppText>
      <AppText style={styles.cardSubtitle}>{subtitle}</AppText>
    </Pressable>
  );
}

export default function HomePage() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText style={styles.h1}>Tiện Chuyến</AppText>
        <AppText style={styles.sub}>Chọn nhanh một tác vụ để bắt đầu</AppText>
      </View>

      <View style={styles.grid}>
        <QuickAction
          title="Tìm tuyến"
          subtitle="Xem các tuyến đang mở"
          onPress={() => router.push("/(tabs)/routes")}
        />
        <QuickAction
          title="Tạo yêu cầu"
          subtitle="Đặt chuyến cho hành khách"
          onPress={() => router.push("/(tabs)/requests")}
        />
        <QuickAction
          title="Ghép chuyến"
          subtitle="Xem/duyệt các ghép chuyến"
          onPress={() => router.push("/(tabs)/matches")}
        />
      </View>

      <Divider />

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Gợi ý nhanh</AppText>
        <View style={styles.pillRow}>
          <View style={styles.pill}><AppText style={styles.pillText}>Tuyến gần bạn</AppText></View>
          <View style={styles.pill}><AppText style={styles.pillText}>Giá tốt</AppText></View>
          <View style={styles.pill}><AppText style={styles.pillText}>Giờ khởi hành sớm</AppText></View>
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

  grid: { gap: 12 },

  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  cardPressed: { opacity: 0.8 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSubtitle: { fontSize: 13, opacity: 0.7, marginTop: 4 },

  section: { marginTop: 14, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },

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
