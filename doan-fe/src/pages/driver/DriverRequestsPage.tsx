import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Screen, AppText, Divider, Loading } from "@/components";
import { useAuth } from "@/store/authStore";
import { matchTripApi } from "@/api/matchtrip/matchtrip.api";
import { useFetchPendingRequestsByDriver } from "@/api/matchtrip/useFetch";
import type { DriverPendingRequestItem } from "@/api/matchtrip/typeds";
import { useRouter } from "expo-router";

export default function DriverRequestsPage() {
  const router = useRouter();
  const { status, user } = useAuth();

  // =========================
  // AUTH GUARD
  // =========================
  if (status === "loading") return <Loading />;

  if (!user) {
    return (
      <Screen>
        <AppText>Bạn chưa đăng nhập.</AppText>
      </Screen>
    );
  }

  if (user.role !== "DRIVER") {
    return (
      <Screen>
        <AppText>Tab này chỉ dành cho tài xế.</AppText>
      </Screen>
    );
  }

  const driverId = user.user_id;

  // =========================
  // DATA – API thật
  // =========================
  const { data, loading, error, refetch } = useFetchPendingRequestsByDriver(driverId);

  const [actingId, setActingId] = React.useState<number | null>(null);

  // =========================
  // ACTIONS
  // =========================
  const onAccept = (item: DriverPendingRequestItem) => {
    Alert.alert("Xác nhận", "Chấp nhận yêu cầu này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Chấp nhận",
        style: "default",
        onPress: async () => {
          try {
            setActingId(item.match_id);

            // ✅ LƯU DB: PENDING -> ACCEPTED
            await matchTripApi.updateStatus({
              match_id: item.match_id,
              match_trip_status: "ACCEPTED",
            });

            Alert.alert("Thành công", "Bạn đã chấp nhận yêu cầu đi nhờ");

            // ✅ refresh list pending để item biến mất
            await refetch();

            // ✅ (tuỳ bạn) chuyển sang tab Matches để thấy ngay
            // đổi path nếu tab matches của bạn khác
            router.replace("/(tabs)/matches");
          } catch (e: any) {
            Alert.alert("Lỗi", e?.message ?? "Không thể chấp nhận yêu cầu");
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
  };

  const onReject = (item: DriverPendingRequestItem) => {
    Alert.alert("Xác nhận", "Từ chối yêu cầu này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Từ chối",
        style: "destructive",
        onPress: async () => {
          try {
            setActingId(item.match_id);

            // ✅ LƯU DB: PENDING -> REJECTED
            await matchTripApi.updateStatus({
              match_id: item.match_id,
              match_trip_status: "REJECTED",
            });

            Alert.alert("Đã từ chối", "Bạn đã từ chối yêu cầu");

            // ✅ refresh list pending để item biến mất
            await refetch();
          } catch (e: any) {
            Alert.alert("Lỗi", e?.message ?? "Không thể từ chối yêu cầu");
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
  };

  // =========================
  // RENDER
  // =========================
  return (
    <Screen>
      <View style={styles.header}>
        <AppText style={styles.h1}>Requests (Driver)</AppText>
      </View>

      <Divider />

      {loading ? <Loading /> : null}
      {error ? (
        <AppText style={styles.err}>Lỗi: {String((error as any)?.message ?? error)}</AppText>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.match_id)}
        onRefresh={refetch}
        refreshing={loading}
        contentContainerStyle={{ paddingTop: 12, gap: 10, paddingBottom: 20 }}
        ListEmptyComponent={
          !loading ? <AppText style={{ marginTop: 12, paddingLeft: 10 }}>Không còn yêu cầu nào.</AppText> : null
        }
        renderItem={({ item }) => {
          const r = item.route;
          const rr = item.ride_request;
          const busy = actingId === item.match_id;

          return (
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>Yêu cầu #{item.match_id}</AppText>

              <AppText style={styles.line}>
                🚗 Tuyến: {r.start_location} → {r.end_location}
              </AppText>
              <AppText style={styles.line}>⏰ Giờ tuyến: {r.time}</AppText>
              <AppText style={styles.line}>
                💰 Giá: {r.price} | Ghế trống: {r.seats}
              </AppText>

              <Divider />

              <AppText style={styles.line}>
                🙋 Khách: {rr.pick_up} → {rr.drop_off}
              </AppText>
              <AppText style={styles.line}>⏰ Giờ khách: {rr.time}</AppText>
              <AppText style={styles.line}>👥 Số chỗ đặt: {rr.passengers}</AppText>

              <AppText style={styles.badge}>Match status: {item.match_trip_status}</AppText>

              <View style={styles.btnRow}>
                <Pressable
                  disabled={busy}
                  style={[styles.smallBtn, styles.accept, busy && { opacity: 0.5 }]}
                  onPress={() => onAccept(item)}
                >
                  <AppText style={styles.smallBtnText}>{busy ? "Đang xử lý..." : "Chấp nhận"}</AppText>
                </Pressable>

                <Pressable
                  disabled={busy}
                  style={[styles.smallBtn, styles.reject, busy && { opacity: 0.5 }]}
                  onPress={() => onReject(item)}
                >
                  <AppText style={styles.smallBtnText}>{busy ? "Đang xử lý..." : "Từ chối"}</AppText>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}

// =========================
// STYLES
// =========================
const styles = StyleSheet.create({
  header: { gap: 6, paddingBottom: 8, paddingLeft: 8, paddingTop: 8 },
  h1: { fontSize: 20, fontWeight: "800" },
  sub: { fontSize: 13, opacity: 0.7 },
  err: { paddingLeft: 10, marginTop: 10, color: "crimson" },

  card: {
    marginHorizontal: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: "900" },
  line: { fontSize: 13, opacity: 0.9 },
  badge: { marginTop: 6, fontSize: 12, opacity: 0.8, fontWeight: "800" },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  smallBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  accept: { borderColor: "#16a34a" },
  reject: { borderColor: "#dc2626" },
  smallBtnText: { fontWeight: "900" },
});
