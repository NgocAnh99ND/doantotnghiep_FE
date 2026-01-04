import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAuth } from "@/store/authStore";
import { AppText, Divider, Screen, Loading } from "@/components";
import { routeApi } from "@/api/route";
import { matchTripApi } from "@/api/matchtrip/matchtrip.api";
import { useFetchAcceptedMatchesByDriver, useFetchFinishedMatchesByDriver } from "@/api/matchtrip/useFetch";
import { useFocusEffect } from "expo-router";

/** =========================
 * Helpers
 ========================= */
function formatWithDots(rawDigits: string) {
  if (!rawDigits) return "";
  const digits = rawDigits.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function toDigits(text: string) {
  return (text ?? "").replace(/\D/g, "");
}

/** =========================
 * Page
 ========================= */
export default function MatchesPage() {
  const { status, user } = useAuth();

  if (status === "loading") return <Loading />;

  if (!user) {
    return (
      <Screen>
        <AppText>Bạn chưa đăng nhập.</AppText>
      </Screen>
    );
  }

  if (user.role === "PASSENGER") {
    const passengerId = user.passenger_id ?? null;
    if (!passengerId) {
      return (
        <Screen>
          <AppText>Thiếu passenger_id. Vui lòng đăng xuất và đăng nhập lại.</AppText>
        </Screen>
      );
    }
    return <PassengerMatchesView passengerId={passengerId} />;
  }

  return <DriverMatchesView driverId={user.user_id} />;
}

function PassengerMatchesView({ passengerId }: { passengerId: number }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await matchTripApi.fetchByPassenger(passengerId);
      setData(list ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Không tải được matches");
    } finally {
      setLoading(false);
    }
  }, [passengerId]);

  React.useEffect(() => { refetch(); }, [refetch]);

  // ✅ quay lại tab matches sẽ tự refresh (để thấy ACCEPTED sau khi driver accept)
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <Screen>
      <View style={{ gap: 6, paddingBottom: 8 }}>
        <AppText style={{ fontSize: 20, fontWeight: "800" }}>Matches (Passenger)</AppText>
      </View>

      <Divider />

      {loading ? <Loading /> : null}
      {error ? <AppText style={{ marginTop: 10, color: "crimson" }}>{error}</AppText> : null}

      <FlatList
        data={data}
        keyExtractor={(it: any) => String(it.match_id)}
        refreshing={loading}
        onRefresh={refetch}
        contentContainerStyle={{ paddingTop: 12, gap: 10, paddingBottom: 20 }}
        ListEmptyComponent={!loading ? <AppText>Chưa có match nào.</AppText> : null}
        renderItem={({ item }: any) => (
          <View
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              backgroundColor: "#fff",
              gap: 6,
            }}
          >
            <AppText style={{ fontSize: 15, fontWeight: "900" }}>Match #{item.match_id}</AppText>
            <AppText style={{ fontSize: 13, opacity: 0.85 }}>route_id: {item.route_id ?? "-"}</AppText>
            <AppText style={{ fontSize: 13, opacity: 0.85 }}>ride_request_id: {item.ride_request_id ?? "-"}</AppText>
            <AppText style={{ marginTop: 6, fontSize: 12, opacity: 0.85, fontWeight: "900" }}>
              Status: {item.match_trip_status}
            </AppText>
          </View>
        )}
      />
    </Screen>
  );
}

/** =========================
 * Driver View: ACCEPTED (API) + FINISHED (API)
 * ✅ FlatList là scroll root
 ========================= */
function DriverMatchesView({ driverId }: { driverId: number }) {
  const [tab, setTab] = React.useState<"ACCEPTED" | "FINISHED">("ACCEPTED");

  // ✅ ACCEPTED: API hook
  const {
    data: acceptedData,
    loading: acceptedLoading,
    error: acceptedError,
    refetch: refetchAccepted,
  } = useFetchAcceptedMatchesByDriver(driverId);

  // ✅ FINISHED: API hook (không còn fake)
  const {
    data: finishedData,
    loading: finishedLoading,
    error: finishedError,
    refetch: refetchFinished,
  } = useFetchFinishedMatchesByDriver(driverId);

  const onFinish = (match_id: number) => {
    Alert.alert("Xác nhận", "Bạn chắc chắn muốn kết thúc chuyến này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Kết thúc",
        style: "default",
        onPress: async () => {
          try {
            await matchTripApi.finishMatch(match_id);
            Alert.alert("Thành công", "Đã kết thúc chuyến.");

            // ✅ refresh cả 2 tab để dữ liệu phản ánh đúng từ BE
            await Promise.all([refetchAccepted(), refetchFinished()]);

            // ✅ nhảy sang tab FINISHED để thấy ngay
            setTab("FINISHED");
          } catch (e: any) {
            Alert.alert("Lỗi", e?.message ?? "Không thể kết thúc chuyến");
          }
        },
      },
    ]);
  };

  const listData = tab === "ACCEPTED" ? (acceptedData ?? []) : (finishedData ?? []);
  const loading = tab === "ACCEPTED" ? acceptedLoading : finishedLoading;
  const error = tab === "ACCEPTED" ? acceptedError : finishedError;
  const onRefresh = tab === "ACCEPTED" ? refetchAccepted : refetchFinished;

  return (
    <Screen>
      <FlatList
        data={listData as any[]}
        keyExtractor={(it: any) => String(it.match_id)}
        refreshing={loading}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <AppText style={styles.h1}>Matches (Driver)</AppText>
              <AppText style={styles.sub}>Đăng tuyến + danh sách match (ACCEPTED → FINISHED)</AppText>
            </View>

            <Divider />

            <CreateRouteBox
              driverId={driverId}
              onCreated={async () => {
                // tạo route xong thì thường ACCEPTED sẽ thay đổi (tuỳ logic BE)
                await refetchAccepted();
              }}
            />

            <View style={styles.tabsRow}>
              <Pressable
                onPress={() => setTab("ACCEPTED")}
                style={[styles.tabBtn, tab === "ACCEPTED" && styles.tabBtnActive]}
              >
                <AppText style={[styles.tabText, tab === "ACCEPTED" && styles.tabTextActive]}>Đang chạy</AppText>
              </Pressable>

              <Pressable
                onPress={() => setTab("FINISHED")}
                style={[styles.tabBtn, tab === "FINISHED" && styles.tabBtnActive]}
              >
                <AppText style={[styles.tabText, tab === "FINISHED" && styles.tabTextActive]}>Đã xong</AppText>
              </Pressable>
            </View>

            <Divider />

            <AppText style={styles.h2}>
              {tab === "ACCEPTED" ? "Danh sách chuyến đã match (ACCEPTED)" : "Danh sách chuyến đã hoàn thành (FINISHED)"}
            </AppText>

            {error ? <AppText style={styles.err}>Lỗi: {String((error as any)?.message ?? error)}</AppText> : null}

            {/* chút khoảng cách trước list */}
            <View style={{ height: 12 }} />
          </>
        }
        ListEmptyComponent={!loading ? <AppText>Chưa có chuyến nào.</AppText> : null}
        renderItem={({ item }: any) => {
          // item luôn có cấu trúc match + route + ride_request (giống tab ACCEPTED bạn đang dùng)
          const r = item.route;
          const rr = item.ride_request;

          return (
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>Match #{item.match_id}</AppText>

              <AppText style={styles.line}>
                Tuyến: {r.start_location} → {r.end_location}
              </AppText>
              <AppText style={styles.line}>Giờ tuyến: {r.time}</AppText>
              <AppText style={styles.line}>
                Giá: {r.price} | Ghế: {r.seats}
              </AppText>
              <AppText style={styles.line}>Route status: {r.route_status}</AppText>

              <Divider />

              <AppText style={styles.line}>
                Khách: {rr.pick_up} → {rr.drop_off}
              </AppText>
              <AppText style={styles.line}>Giờ khách: {rr.time}</AppText>
              <AppText style={styles.line}>Số chỗ khách đặt: {rr.passengers}</AppText>
              <AppText style={styles.line}>RideRequest status: {rr.ride_request_status}</AppText>

              <AppText style={styles.badge}>Match status: {item.match_trip_status}</AppText>

              {/* ✅ Chỉ hiện nút finish ở tab ACCEPTED */}
              {tab === "ACCEPTED" ? (
                <Pressable style={styles.finishBtn} onPress={() => onFinish(item.match_id)}>
                  <AppText style={styles.finishText}>Kết thúc chuyến đi</AppText>
                </Pressable>
              ) : null}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </Screen>
  );
}

/** =========================
 * Create Route Box (giữ nguyên)
 ========================= */
function CreateRouteBox({
  driverId,
  onCreated,
}: {
  driverId: number;
  onCreated: () => Promise<void> | void;
}) {
  const [loading, setLoading] = React.useState(false);

  const [startLocation, setStartLocation] = React.useState("");
  const [endLocation, setEndLocation] = React.useState("");
  const [time, setTime] = React.useState("");
  const [seats, setSeats] = React.useState("4");
  const [priceRaw, setPriceRaw] = React.useState("150000");

  const reset = () => {
    setStartLocation("");
    setEndLocation("");
    setTime("");
    setSeats("4");
    setPriceRaw("150000");
  };

  const submit = async () => {
    if (!startLocation.trim() || !endLocation.trim() || !time.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập điểm đi, điểm đến và thời gian.");
      return;
    }

    const seatsNum = Number(toDigits(seats));
    const priceNum = Number(priceRaw);

    if (!seatsNum || Number.isNaN(seatsNum) || seatsNum <= 0) {
      Alert.alert("Sai dữ liệu", "Số ghế phải là số > 0.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      Alert.alert("Sai dữ liệu", "Giá phải là số hợp lệ.");
      return;
    }

    setLoading(true);
    try {
      await routeApi.create({
        driver_id: driverId,
        start_location: startLocation.trim(),
        end_location: endLocation.trim(),
        time: time.trim(),
        seats: seatsNum,
        price: priceNum,
      });

      Alert.alert("Thành công", "Đã đăng tuyến xe.");
      reset();
      await onCreated();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Không thể đăng tuyến");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.createBox}>
      <AppText style={styles.h2}>Đăng tuyến xe</AppText>

      <View style={{ gap: 10 }}>
        <TextInput
          value={startLocation}
          onChangeText={setStartLocation}
          placeholder="Điểm đi (start_location)"
          style={styles.input}
        />
        <TextInput value={endLocation} onChangeText={setEndLocation} placeholder="Điểm đến (end_location)" style={styles.input} />
        <TextInput value={time} onChangeText={setTime} placeholder='Thời gian (vd "2025-01-10 08:00")' style={styles.input} />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput
            value={seats}
            onChangeText={(t) => setSeats(toDigits(t))}
            placeholder="Số ghế"
            keyboardType="number-pad"
            style={[styles.input, { flex: 1, minWidth: 0 }]}
          />

          <TextInput
            value={formatWithDots(priceRaw)}
            onChangeText={(t) => setPriceRaw(toDigits(t))}
            placeholder="Giá"
            keyboardType="number-pad"
            style={[styles.input, { flex: 1, minWidth: 0 }]}
          />
        </View>

        <Pressable onPress={submit} disabled={loading} style={[styles.btn, loading && { opacity: 0.6 }]}>
          <AppText style={styles.btnText}>{loading ? "Đang đăng..." : "Đăng tuyến"}</AppText>
        </Pressable>
      </View>
    </View>
  );
}

/** =========================
 * Styles
 ========================= */
const styles = StyleSheet.create({
  header: { gap: 6, paddingBottom: 8 },
  h1: { fontSize: 20, fontWeight: "800" },
  h2: { fontSize: 16, fontWeight: "800" },
  sub: { fontSize: 13, opacity: 0.7 },
  err: { marginTop: 10, color: "crimson" },

  listContent: {
    padding: 10,
    paddingBottom: 40,
  },

  createBox: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    backgroundColor: "#fff",
    gap: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  btn: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#111", alignItems: "center" },
  btnText: { fontWeight: "800" },

  tabsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  tabBtnActive: { borderColor: "#111827" },
  tabText: { fontWeight: "800", opacity: 0.6 },
  tabTextActive: { opacity: 1 },

  card: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: "900" },
  line: { fontSize: 13, opacity: 0.9 },
  badge: { marginTop: 6, fontSize: 12, opacity: 0.85, fontWeight: "900" },

  finishBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
  },
  finishText: { fontWeight: "900" },
});
