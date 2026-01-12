import React from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, AppText, AppInput, AppButton, Divider } from "@/components";
import { rideRequestApi } from "@/api/riderequest";
import { useAuth } from "@/store/authStore"; // ✅ thêm

export default function CreateRequestPage() {
    const router = useRouter();
    const { user } = useAuth(); // ✅ lấy user từ store

    // ❌ bỏ input passengerId (không nhập tay nữa)
    const [pickUp, setPickUp] = React.useState("");
    const [dropOff, setDropOff] = React.useState("");
    const [time, setTime] = React.useState("");
    const [passengers, setPassengers] = React.useState("1");

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const onSubmit = async () => {
        setError(null);

        // ✅ validate auth + role + passenger_id
        if (!user) return setError("Bạn chưa đăng nhập");
        if (user.role !== "PASSENGER") return setError("Chỉ tài khoản HÀNH KHÁCH mới tạo được yêu cầu");

        const passengerId = user.passenger_id ?? null;
        if (!passengerId) {
            return setError("Thiếu passenger_id. Vui lòng đăng xuất và đăng nhập lại.");
        }

        const body = {
            passenger_id: passengerId, // ✅ dùng passenger_id từ auth
            pick_up: pickUp.trim(),
            drop_off: dropOff.trim(),
            time: time.trim(),
            passengers: Number(passengers),
        };

        if (!body.pick_up || !body.drop_off || !body.time) return setError("Vui lòng nhập đủ thông tin");
        if (!Number.isFinite(body.passengers) || body.passengers <= 0) return setError("Số người không hợp lệ");

        setLoading(true);
        try {
            await rideRequestApi.create(body);
            router.replace("/(tabs)/routes" as any);
        } catch (e: any) {
            setError(e?.message ?? "Tạo yêu cầu thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen>
            <AppText style={styles.h1}>Tạo yêu cầu đi xe</AppText>
            <AppText style={styles.sub}>Gửi yêu cầu để tìm tuyến phù hợp</AppText>
            <Divider />

            {error ? <AppText style={styles.err}>{error}</AppText> : null}

            <View style={{ gap: 10, marginTop: 12 }}>
                {/* ✅ hiển thị passenger_id để debug (không cho nhập) */}
                <AppText style={styles.meta}>
                    passenger_id: {user?.passenger_id ?? "(chưa có)"} | role: {user?.role ?? "(chưa login)"}
                </AppText>

                <AppInput value={pickUp} onChangeText={setPickUp} placeholder="Điểm đón (pick_up)" />
                <AppInput value={dropOff} onChangeText={setDropOff} placeholder="Điểm trả (drop_off)" />
                <AppInput value={time} onChangeText={setTime} placeholder="Thời gian (time)" />
                <AppInput value={passengers} onChangeText={setPassengers} placeholder="Số người (passengers)" />

                <AppButton title={loading ? "Đang tạo..." : "Tạo yêu cầu"} onPress={onSubmit} disabled={loading} />
                <AppButton title="Huỷ" onPress={() => router.back()} />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    h1: { fontSize: 20, fontWeight: "900" },
    sub: { marginTop: 6, fontSize: 13, opacity: 0.7 },
    err: { marginTop: 10, color: "crimson" },
    meta: { marginTop: 8, fontSize: 12, opacity: 0.7 }, // ✅ thêm
});
