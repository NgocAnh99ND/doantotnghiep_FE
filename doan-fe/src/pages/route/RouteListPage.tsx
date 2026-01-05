import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, AppText, Divider, Loading, AppButton } from "@/components";
import { routeApi } from "@/api/route";
import type { RouteDTO } from "@/api/route/types";
import { useAuth } from "@/store/authStore";
import { rideRequestApi } from "@/api/riderequest";
import { matchTripApi } from "@/api/matchtrip/matchtrip.api";

export default function RouteListPage() {
  const router = useRouter();
  const { user, status } = useAuth();

  const params = useLocalSearchParams<{
    start?: string;
    end?: string;
    time?: string;
    passengers?: string;
  }>();

  const start = (params.start ?? "").trim();
  const end = (params.end ?? "").trim();
  const time = (params.time ?? "").trim();
  const passengers = Number((params.passengers ?? "1").trim() || "1");

  const [data, setData] = React.useState<RouteDTO[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actingRouteId, setActingRouteId] = React.useState<number | null>(null);

  const canSearch = !!start && !!end;

  const refetch = React.useCallback(async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);

    try {
      // ✅ call thuật toán BE
      const list = await routeApi.searchSuggested({ start, end });
      setData(list ?? []);
    } catch (e: any) {
      // fallback tạm: nếu endpoint suggest chưa đúng, vẫn cho app chạy
      try {
        const all = await routeApi.fetchAll();
        const filtered = (all ?? []).filter((r) => {
          const s = (r.start_location ?? "").toLowerCase();
          const d = (r.end_location ?? "").toLowerCase();
          return s.includes(start.toLowerCase()) && d.includes(end.toLowerCase());
        });
        setData(filtered);
        setError("Không gọi được API suggest (đang fallback filter local). Bạn cần sửa ENDPOINT.suggest theo BE.");
      } catch (e2: any) {
        setError(e2?.message ?? e?.message ?? "Không tải được danh sách tuyến");
      }
    } finally {
      setLoading(false);
    }
  }, [canSearch, start, end]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const onBook = async (route: RouteDTO) => {
    if (status === "loading") return;
    if (!user) return Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để đặt xe.");
    if (user.role !== "PASSENGER") return Alert.alert("Không hợp lệ", "Chỉ hành khách mới đặt xe.");
    const passengerId = user.passenger_id ?? null;
    if (!passengerId) return Alert.alert("Thiếu dữ liệu", "Thiếu passenger_id. Hãy đăng xuất và đăng nhập lại.");

    // validate passengers/time
    const pax = Number.isFinite(passengers) && passengers > 0 ? passengers : 1;
    const timeValue = time || new Date().toISOString(); // ✅ nếu user chưa nhập thì lấy hiện tại

    Alert.alert(
      "Xác nhận đặt xe",
      `Đặt tuyến #${route.route_id}?\n${route.start_location} → ${route.end_location}`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Đặt xe",
          style: "default",
          onPress: async () => {
            try {
              setActingRouteId(route.route_id);

              // 1) tạo ride_request trong DB
              const rr = await rideRequestApi.create({
                passenger_id: passengerId,
                pick_up: start,
                drop_off: end,
                time: timeValue,
                passengers: pax,
              });

              // 2) tạo match_trip(PENDING) trong DB
              await matchTripApi.create({
                route_id: route.route_id,
                ride_request_id: rr.ride_request_id,
              });

              Alert.alert("Thành công", "Đã gửi yêu cầu. Chờ tài xế chấp nhận.");

              // 3) chuyển sang tab matches (passenger)
              router.replace("/(tabs)/matches");
            } catch (e: any) {
              Alert.alert("Lỗi", e?.message ?? "Không thể đặt xe");
            } finally {
              setActingRouteId(null);
            }
          },
        },
      ]
    );
  };

  const onCancel = (route: RouteDTO) => {
    // tuỳ nghiệp vụ: huỷ match_trip/ride_request cần endpoint BE
    Alert.alert("Chưa hỗ trợ", "Bạn cần API cancel match_trip hoặc cancel ride_request theo nghiệp vụ.");
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText style={styles.h1}>Routes phù hợp</AppText>
        <AppText style={styles.sub}>
          {canSearch ? `Từ "${start}" đến "${end}"` : "Hãy nhập điểm đi/đến ở tab Home"}
        </AppText>
      </View>

      <Divider />

      {!canSearch ? (
        <View style={{ marginTop: 12, gap: 10 }}>
          <AppText>Chưa có tiêu chí tìm kiếm.</AppText>
          <AppButton title="Quay lại Home" onPress={() => router.replace("/(tabs)/home")} />
        </View>
      ) : null}

      {loading ? <Loading /> : null}
      {error ? <AppText style={styles.err}>{error}</AppText> : null}

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.route_id)}
        contentContainerStyle={{ paddingTop: 12, gap: 10, paddingBottom: 20 }}
        onRefresh={refetch}
        refreshing={loading}
        ListEmptyComponent={!loading ? <AppText>Không có tuyến phù hợp.</AppText> : null}
        renderItem={({ item }) => {
          const busy = actingRouteId === item.route_id;

          return (
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>
                {item.start_location} → {item.end_location}
              </AppText>
              <AppText style={styles.cardSub}>
                Giờ: {item.time} | Ghế: {item.seats} | Giá: {item.price}
              </AppText>
              {item.route_status ? <AppText style={styles.badge}>Trạng thái: {item.route_status}</AppText> : null}

              <View style={styles.btnRow}>
                <Pressable
                  disabled={busy}
                  onPress={() => onBook(item)}
                  style={[styles.btn, styles.bookBtn, busy && { opacity: 0.5 }]}
                >
                  <AppText style={styles.btnText}>{busy ? "Đang xử lý..." : "Đặt xe"}</AppText>
                </Pressable>

                <Pressable
                  disabled={busy}
                  onPress={() => onCancel(item)}
                  style={[styles.btn, styles.cancelBtn, busy && { opacity: 0.5 }]}
                >
                  <AppText style={styles.btnTextCancel}>Hủy</AppText>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6, paddingBottom: 8 },
  h1: { fontSize: 20, fontWeight: "800" },
  sub: { fontSize: 13, opacity: 0.7 },
  err: { marginTop: 10, color: "crimson" },

  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  cardSub: { marginTop: 4, fontSize: 13, opacity: 0.75 },
  badge: { marginTop: 6, fontSize: 12, opacity: 0.8 },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  bookBtn: { borderColor: "#111", backgroundColor: "#111" },
  cancelBtn: { borderColor: "#dc2626" },
  btnText: { fontWeight: "900", color: "#fff" },
  btnTextCancel:{fontWeight: "900", color: "#111"}
});
