import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, AppText, Divider, Loading, AppButton } from "@/components";
import { routeApi } from "@/api/route";
import type { RouteDTO } from "@/api/route/types";
import { useAuth } from "@/store/authStore";
import { rideRequestApi } from "@/api/riderequest";
import { matchTripApi } from "@/api/matchtrip/matchtrip.api";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function nowToBeDateTimeString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}


function toNumParam(v: any): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

type FindByABItem = {
  route_id: number;
  nearest_pickup?: { lat: number; lng: number };
  distance_pickup_m?: number;
};

function fmtMoney(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  try {
    return n.toLocaleString("vi-VN");
  } catch {
    return String(n);
  }
}

function fmtMeters(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  if (n < 1000) return `${Math.round(n)} m`;
  return `${(n / 1000).toFixed(1)} km`;
}

export default function RouteListPage() {
  const router = useRouter();
  const { user, status } = useAuth();

  const params = useLocalSearchParams<{
    start?: string;
    end?: string;

    // coords optional (HomePage có thì truyền)
    a_lat?: string;
    a_lng?: string;
    b_lat?: string;
    b_lng?: string;

    time?: string;
    passengers?: string;
  }>();

  const start = (params.start ?? "").trim();
  const end = (params.end ?? "").trim();

  const a_lat = toNumParam(params.a_lat);
  const a_lng = toNumParam(params.a_lng);
  const b_lat = toNumParam(params.b_lat);
  const b_lng = toNumParam(params.b_lng);

  const time = (params.time ?? "").trim();
  const passengers = Number((params.passengers ?? "1").trim() || "1");

  const [data, setData] = React.useState<RouteDTO[]>([]);
  const [metaByRouteId, setMetaByRouteId] = React.useState<Record<number, FindByABItem>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actingRouteId, setActingRouteId] = React.useState<number | null>(null);

  const hasText = !!start && !!end;
  const hasCoords = [a_lat, a_lng, b_lat, b_lng].every((x) => typeof x === "number");

  const refetch = React.useCallback(async () => {
    if (!hasText) return;

    setLoading(true);
    setError(null);

    try {
      if (!hasCoords) {
        // Nếu BE đang bắt buộc coords thì bạn sẽ thấy message lỗi từ BE.
        // Nhưng với flow đúng, Home nên truyền coords khi user ghim/chọn trên map.
        setData([]);
        setMetaByRouteId({});
        setError("Thiếu tọa độ A/B. Hãy ghim điểm trên bản đồ rồi bấm Tìm tuyến.");
        return;
      }

      // 1) Gọi API thuật toán: trả về route_id + khoảng cách
      const hits = (await routeApi.findByAB({
        start,
        end,
        a_lat: a_lat as number,
        a_lng: a_lng as number,
        b_lat: b_lat as number,
        b_lng: b_lng as number,
      })) as unknown as FindByABItem[];

      const ids = (hits ?? []).map((h) => Number(h.route_id)).filter((x) => Number.isFinite(x));

      // lưu meta để hiển thị khoảng cách nếu muốn
      const meta: Record<number, FindByABItem> = {};
      for (const h of hits ?? []) {
        if (Number.isFinite(Number(h.route_id))) meta[Number(h.route_id)] = h;
      }
      setMetaByRouteId(meta);

      if (ids.length === 0) {
        setData([]);
        return;
      }

      // 2) Hydrate detail: gọi /api/route/detail?route_id=...
      const details = await Promise.all(ids.map((id) => routeApi.fetchDetail(id)));

      // 3) giữ thứ tự theo thuật toán (gần -> xa)
      const byId = new Map<number, RouteDTO>();
      for (const r of details ?? []) {
        if (r && Number.isFinite(Number((r as any).route_id))) byId.set(Number((r as any).route_id), r as any);
      }
      const ordered: RouteDTO[] = ids.map((id) => byId.get(id)).filter(Boolean) as RouteDTO[];

      setData(ordered);
    } catch (e: any) {
      setData([]);
      setMetaByRouteId({});
      setError(e?.message ?? "Không tải được danh sách tuyến");
    } finally {
      setLoading(false);
    }
  }, [hasText, hasCoords, start, end, a_lat, a_lng, b_lat, b_lng]);

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
    const timeValue = time?.trim() || nowToBeDateTimeString();


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
                pick_up_lat: a_lat as number,
                pick_up_lng: a_lng as number,
                drop_off: end,
                drop_off_lat: b_lat as number,
                drop_off_lng: b_lng as number,

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
          {hasText ? `Từ "${start}" đến "${end}"` : "Hãy nhập điểm đi/đến ở tab Home"}
        </AppText>
      </View>

      <Divider />

      {!hasText ? (
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
        ListEmptyComponent={!loading && hasText ? <AppText>Không có tuyến phù hợp.</AppText> : null}
        renderItem={({ item }) => {
          const busy = actingRouteId === item.route_id;
          const meta = metaByRouteId[item.route_id];

          return (
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>
                {item.start_location} → {item.end_location}
              </AppText>

              <AppText style={styles.cardSub}>
                Giờ: {item.time} | Ghế: {item.seats} | Giá: {fmtMoney(item.price)}đ
              </AppText>

              {meta?.distance_pickup_m != null ? (
                <AppText style={styles.meta}>
                  Cách điểm đón: {fmtMeters(meta.distance_pickup_m)}
                </AppText>
              ) : null}

              {item.route_status ? <AppText style={styles.badge}>Trạng thái: {item.route_status}</AppText> : null}

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
  cardSub: { marginTop: 4, fontSize: 13, opacity: 0.85 },
  meta: { marginTop: 4, fontSize: 12, opacity: 0.75 },
  badge: { marginTop: 6, fontSize: 12, opacity: 0.8 },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  bookBtn: { borderColor: "#111", backgroundColor: "#111" },
  btnText: { fontWeight: "900", color: "#fff" },
});
