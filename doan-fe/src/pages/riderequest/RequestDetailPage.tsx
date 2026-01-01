import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, AppText, Divider, Loading, AppButton } from "@/components";
import { rideRequestApi, useFetchRideRequestDetail } from "@/api/riderequest";

export default function RequestDetailPage() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data, loading, error, refetch } = useFetchRideRequestDetail(id);

    const onCancel = async () => {
        if (!id) return;
        await rideRequestApi.cancel({ ride_request_id: Number(id) }); // PUT cancel :contentReference[oaicite:13]{index=13}
        await refetch();
    };

    return (
        <Screen>
            <View style={styles.header}>
                <AppText style={styles.h1}>Chi tiết yêu cầu</AppText>
                <AppText style={styles.sub}>ride_request_id: {id}</AppText>
            </View>

            <Divider />

            {loading ? <Loading /> : null}

            {error ? (
                <View style={styles.box}>
                    <AppText style={styles.errTitle}>Không tải được chi tiết</AppText>
                    <AppText style={styles.errSub}>{String((error as any)?.message ?? error)}</AppText>
                    <Pressable onPress={refetch} style={styles.btn}>
                        <AppText style={styles.btnText}>Tải lại</AppText>
                    </Pressable>
                </View>
            ) : null}

            {data ? (
                <View style={styles.card}>
                    <AppText style={styles.title}>
                        {data.pick_up} → {data.drop_off}
                    </AppText>
                    <AppText style={styles.line}>Giờ: {data.time}</AppText>
                    <AppText style={styles.line}>Số người: {data.passengers}</AppText>
                    {data.status ? <AppText style={styles.line}>Trạng thái: {data.status}</AppText> : null}

                    <View style={{ gap: 10, marginTop: 12 }}>
                        <AppButton title="Huỷ yêu cầu" onPress={onCancel} />
                        <AppButton title="Quay lại" onPress={() => router.back()} />
                    </View>
                </View>
            ) : null}
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: { gap: 6, paddingBottom: 8 },
    h1: { fontSize: 20, fontWeight: "800" },
    sub: { fontSize: 13, opacity: 0.7 },

    box: { paddingTop: 12, gap: 6 },
    errTitle: { fontWeight: "800" },
    errSub: { opacity: 0.75 },
    btn: { paddingVertical: 10 },
    btnText: { fontWeight: "800" },

    card: { paddingTop: 12, gap: 8 },
    title: { fontSize: 16, fontWeight: "900" },
    line: { fontSize: 13, opacity: 0.85 },
});
