import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAuth } from "@/store/authStore";
import { AppText, Divider, Screen, Loading } from "@/components";
import { routeApi } from "@/api/route";
import { matchTripApi } from "@/api/matchtrip/matchtrip.api";
import { useFetchAcceptedMatchesByDriver } from "@/api/matchtrip/useFetch";

function formatWithDots(rawDigits: string) {
  if (!rawDigits) return "";
  const digits = rawDigits.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function toDigits(text: string) {
  return (text ?? "").replace(/\D/g, "");
}

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
    // Passenger view giữ như bạn đang làm (nếu muốn mình gộp lại đúng luồng passenger sau)
    return (
      <Screen>
        <AppText>Passenger Matches: (giữ phần cũ nếu bạn cần)</AppText>
      </Screen>
    );
  }

  // DRIVER
  return <DriverMatchesView driverId={user.user_id} />;
}

function DriverMatchesView({ driverId }: { driverId: number }) {
  const { data, loading, error, refetch } = useFetchAcceptedMatchesByDriver(driverId);

  const onFinish = async (match_id: number) => {
    try {
      await matchTripApi.finishMatch(match_id);
      Alert.alert("Thành công", "Đã kết thúc chuyến.");
      await refetch();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Không thể kết thúc chuyến");
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText style={styles.h1}>Matches (Driver)</AppText>
        <AppText style={styles.sub}>Đăng tuyến + danh sách chuyến đã match (ACCEPTED)</AppText>
      </View>

      <Divider />

      <CreateRouteBox driverId={driverId} onCreated={refetch} />

      <View style={{ marginTop: 14 }}>
        <AppText style={styles.h2}>Danh sách chuyến đã match</AppText>
        {loading ? <Loading /> : null}
        {error ? <AppText style={styles.err}>Lỗi: {String((error as any)?.message ?? error)}</AppText> : null}

        <FlatList
          data={data}
          keyExtractor={(it) => String(it.match_id)}
          onRefresh={refetch}
          refreshing={loading}
          contentContainerStyle={{ paddingTop: 12, gap: 10, paddingBottom: 20 }}
          ListEmptyComponent={!loading ? <AppText>Chưa có chuyến match nào.</AppText> : null}
          renderItem={({ item }) => {
            const r = item.route;
            const rr = item.ride_request;

            return (
              <View style={styles.card}>
                <AppText style={styles.cardTitle}>Match #{item.match_id}</AppText>

                <AppText style={styles.line}>
                  Tuyến: {r.start_location} → {r.end_location}
                </AppText>
                <AppText style={styles.line}>Giờ tuyến: {r.time}</AppText>
                <AppText style={styles.line}>Giá: {r.price} | Ghế: {r.seats}</AppText>
                <AppText style={styles.line}>Route status: {r.route_status}</AppText>

                <Divider />

                <AppText style={styles.line}>
                  Khách: {rr.pick_up} → {rr.drop_off}
                </AppText>
                <AppText style={styles.line}>Giờ khách: {rr.time}</AppText>
                <AppText style={styles.line}>Số chỗ khách đặt: {rr.passengers}</AppText>
                <AppText style={styles.line}>RideRequest status: {rr.ride_request_status}</AppText>

                <AppText style={styles.badge}>Match status: {item.match_trip_status}</AppText>

                <Pressable style={styles.finishBtn} onPress={() => onFinish(item.match_id)}>
                  <AppText style={styles.finishText}>Kết thúc chuyến đi</AppText>
                </Pressable>
              </View>
            );
          }}
        />
      </View>
    </Screen>
  );
}

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
        <TextInput value={startLocation} onChangeText={setStartLocation} placeholder="Điểm đi (start_location)" style={styles.input} />
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

const styles = StyleSheet.create({
  header: { gap: 6, paddingBottom: 8 },
  h1: { fontSize: 20, fontWeight: "800" },
  h2: { fontSize: 16, fontWeight: "800" },
  sub: { fontSize: 13, opacity: 0.7 },
  err: { marginTop: 10, color: "crimson" },

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
