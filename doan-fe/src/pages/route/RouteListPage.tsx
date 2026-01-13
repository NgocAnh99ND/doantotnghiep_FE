import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, View, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";

import { Screen, AppText, Divider, Loading, AppButton } from "@/components";
import { routeApi } from "@/api/route";
import type { RouteDTO } from "@/api/route/types";
import { useAuth } from "@/store/authStore";
import { rideRequestApi } from "@/api/riderequest";
import { matchTripApi } from "@/api/matchtrip/matchtrip.api";

type LatLng = { lat: number; lng: number };

async function forwardGeocode(text: string): Promise<LatLng | null> {
  if (Platform.OS === "web") return null;
  const q = (text || "").trim();
  if (!q) return null;
  try {
    const res = await Location.geocodeAsync(q);
    const first = res?.[0];
    if (!first) return null;
    return { lat: first.latitude, lng: first.longitude };
  } catch {
    return null;
  }
}

function toNum(v: unknown): number | null {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

export default function RouteListPage() {
  const router = useRouter();
  const { user, status } = useAuth();

  const params = useLocalSearchParams<{
    start?: string;
    end?: string;
    a_lat?: string;
    a_lng?: string;
    b_lat?: string;
    b_lng?: string;
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
      // ✅ lấy toạ độ từ params (nếu HomePage đã gửi)
      let a_lat = toNum(params.a_lat);
      let a_lng = toNum(params.a_lng);
      let b_lat = toNum(params.b_lat);
      let b_lng = toNum(params.b_lng);

      // ✅ nếu thiếu (hiếm) -> tự geocode từ text (mobile)
      if ((a_lat == null || a_lng == null) && Platform.OS !== "web") {
        const p = await forwardGeocode(start);
        if (p) {
          a_lat = p.lat;
          a_lng = p.lng;
        }
      }
      if ((b_lat == null || b_lng == null) && Platform.OS !== "web") {
        const p = await forwardGeocode(end);
        if (p) {
          b_lat = p.lat;
          b_lng = p.lng;
        }
      }

      // ✅ BE đang bắt buộc a_lat,a_lng,b_lat,b_lng
      if (a_lat == null || a_lng == null || b_lat == null || b_lng == null) {
        throw new Error("Thiếu toạ độ (a_lat,a_lng,b_lat,b_lng). Hãy ghim điểm trên map hoặc chờ app geocode.");
      }

      // ✅ gọi thuật toán BE
      // Nếu bạn đặt hàm routeApi.findByAB như mình hướng dẫn ở trên:
      const list = await (routeApi as any).findByAB({
        start,
        end,
        a_lat,
        a_lng,
        b_lat,
        b_lng,
      });

      setData(list ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Không tải được danh sách tuyến");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [canSearch, start, end, params.a_lat, params.a_lng, params.b_lat, params.b_lng]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const onBook = async (route: RouteDTO) => {
    if (status === "loading") return;
    if (!user) return Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để đặt xe.");
    if (user.role !== "PASSENGER") return Alert.alert("Không hợp lệ", "Chỉ hành khách mới đặt xe.");

    const passengerId = user.passenger_id ?? null;
    if (!passengerId) return Alert.alert("Thiếu dữ liệu", "Thiếu passenger_id. Hãy đăng xuất và đăng nhập lại.");

    const pax = Number.isFinite(passengers) && passengers > 0 ? passengers : 1;
    const timeValue = time || new Date().toISOString();

    Alert.alert(
      "Xác nhận đặt xe",
      `Đặt tuyến #${route.route_id}?\n${route.start_location} → ${route.end_location}`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Đặt xe",
          onPress: async () => {
            try {
              setActingRouteId(route.route_id);

              const rr = await rideRequestApi.create({
                passenger_id: passengerId,
                pick_up: start,
                drop_off: end,
                time: timeValue,
                passengers: pax,
              });

              await matchTripApi.create({
                route_id: route.route_id,
                ride_request_id: rr.ride_request_id,
              });

              Alert.alert("Thành công", "Đã gửi yêu cầu. Chờ tài xế chấp nhận.");
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

              <View style={styles.btnRow}>
                <Pressable
                  disabled={busy}
                  onPress={() => onBook(item)}
                  style={[styles.btn, styles.bookBtn, busy && { opacity: 0.5 }]}
                >
                  <AppText style={styles.btnText}>{busy ? "Đang xử lý..." : "Đặt xe"}</AppText>
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

  btnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  bookBtn: { borderColor: "#111", backgroundColor: "#111" },
  btnText: { fontWeight: "900", color: "#fff" },
});
