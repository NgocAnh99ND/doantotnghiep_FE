import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, AppText, Divider, Loading } from "@/components";
import { useFetchRouteDetail } from "@/api/route";

export default function RouteDetailPage() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data, loading, error, refetch } = useFetchRouteDetail(id);

    return (
        <Screen>
            <View style={styles.header}>
                <AppText style={styles.h1}>Chi tiết tuyến</AppText>
                <AppText style={styles.sub}>route_id: {id}</AppText>
            </View>

            <Divider />

            {loading ? <Loading /> : null}

            {error ? (
                <View style={styles.box}>
                    <AppText style={styles.errTitle}>Không tải được chi tiết tuyến</AppText>
                    <AppText style={styles.errSub}>{String((error as any)?.message ?? error)}</AppText>
                    <Pressable onPress={refetch} style={styles.btn}>
                        <AppText style={styles.btnText}>Tải lại</AppText>
                    </Pressable>
                </View>
            ) : null}

            {data ? (
                <View style={styles.card}>
                    <AppText style={styles.title}>
                        {data.start_location} → {data.end_location}
                    </AppText>

                    <AppText style={styles.line}>Giờ: {data.time}</AppText>
                    <AppText style={styles.line}>Số ghế: {data.seats}</AppText>
                    <AppText style={styles.line}>Giá: {data.price}</AppText>
                    {data.route_status ? <AppText style={styles.line}>Trạng thái: {data.route_status}</AppText> : null}

                    <Pressable onPress={() => router.back()} style={[styles.btn, { marginTop: 12 }]}>
                        <AppText style={styles.btnText}>Quay lại</AppText>
                    </Pressable>
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
