import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Screen, AppButton, AppText, Divider, Loading } from "@/components";
import { useAuth } from "@/store/authStore";
import { matchTripApi } from "@/api/matchtrip/matchtrip.api";
import { useFetchPendingRequestsByDriver } from "@/api/matchtrip/useFetch";

export default function DriverRequestsPage() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

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

  const { data, loading, error, refetch } = useFetchPendingRequestsByDriver(driverId);

  const onAccept = async (match_id: number) => {
    try {
      await matchTripApi.updateStatus({ match_id, match_trip_status: "ACCEPTED" });
      Alert.alert("Thành công", "Bạn đã chấp nhận yêu cầu.");
      await refetch();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Không thể chấp nhận");
    }
  };

  const onReject = async (match_id: number) => {
    try {
      await matchTripApi.updateStatus({ match_id, match_trip_status: "REJECTED" });
      Alert.alert("Đã từ chối", "Bạn đã từ chối yêu cầu.");
      await refetch();
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Không thể từ chối");
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText style={styles.h1}>Requests (Driver)</AppText>
        <AppText style={styles.sub}>Danh sách khách đang xin đi nhờ (PENDING)</AppText>
      </View>

      <Divider />

      {loading ? <Loading /> : null}
      {error ? <AppText style={styles.err}>Lỗi: {String((error as any)?.message ?? error)}</AppText> : null}

      <FlatList
        data={data}
        keyExtractor={(it) => String(it.match_id)}
        onRefresh={refetch}
        refreshing={loading}
        contentContainerStyle={{ paddingTop: 12, gap: 10, paddingBottom: 20 }}
        ListEmptyComponent={!loading ? <AppText>Chưa có yêu cầu nào.</AppText> : null}
        renderItem={({ item }) => {
          const r = item.route;
          const rr = item.ride_request;

          return (
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>Yêu cầu #{item.match_id}</AppText>

              <AppText style={styles.line}>
                Tuyến: {r.start_location} → {r.end_location}
              </AppText>
              <AppText style={styles.line}>Giờ tuyến: {r.time}</AppText>
              <AppText style={styles.line}>Giá: {r.price} | Ghế còn: {r.seats}</AppText>
              <AppText style={styles.line}>Route status: {r.route_status}</AppText>

              <Divider />

              <AppText style={styles.line}>
                Khách muốn đi: {rr.pick_up} → {rr.drop_off}
              </AppText>
              <AppText style={styles.line}>Giờ khách: {rr.time}</AppText>
              <AppText style={styles.line}>Số chỗ khách đặt: {rr.passengers}</AppText>
              <AppText style={styles.line}>RideRequest status: {rr.ride_request_status}</AppText>

              <AppText style={styles.badge}>Match status: {item.match_trip_status}</AppText>

              <View style={styles.btnRow}>
                <Pressable style={[styles.smallBtn, styles.accept]} onPress={() => onAccept(item.match_id)}>
                  <AppText style={styles.smallBtnText}>Chấp nhận</AppText>
                </Pressable>
                <Pressable style={[styles.smallBtn, styles.reject]} onPress={() => onReject(item.match_id)}>
                  <AppText style={styles.smallBtnText}>Từ chối</AppText>
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

  card: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: "900" },
  line: { fontSize: 13, opacity: 0.9 },
  badge: { marginTop: 6, fontSize: 12, opacity: 0.8, fontWeight: "800" },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  smallBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  accept: { borderColor: "#16a34a" },
  reject: { borderColor: "#dc2626" },
  smallBtnText: { fontWeight: "900" },
});
