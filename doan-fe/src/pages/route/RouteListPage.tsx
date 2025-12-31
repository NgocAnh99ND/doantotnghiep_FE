import React from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, AppText, Divider, Loading } from "@/components";
import { useFetchRoutes } from "@/api/route";

export default function RouteListPage() {
    const router = useRouter();
    const { data, loading, error, refetch } = useFetchRoutes();

    return (
        <Screen>
            <View style={styles.header}>
                <AppText style={styles.h1}>Danh sách tuyến</AppText>
                <AppText style={styles.sub}>Chạm vào một tuyến để xem chi tiết</AppText>
            </View>

            <Divider />

            {loading ? <Loading /> : null}

            {error ? (
                <View style={styles.box}>
                    <AppText style={styles.errTitle}>Không tải được danh sách tuyến</AppText>
                    <AppText style={styles.errSub}>{String((error as any)?.message ?? error)}</AppText>
                    <Pressable onPress={refetch} style={styles.btn}>
                        <AppText style={styles.btnText}>Tải lại</AppText>
                    </Pressable>
                </View>
            ) : null}

            <FlatList
                data={data}
                keyExtractor={(item) => String(item.route_id)}
                contentContainerStyle={{ paddingTop: 12, gap: 10 }}
                onRefresh={refetch}
                refreshing={loading}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.push(`/route/${item.route_id}` as any)}
                        // router.push({
                        //     pathname: "/route/[id]",
                        //     params: { id: String(item.route_id) },
                        // });

                        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                    >
                        <AppText style={styles.cardTitle}>
                            {item.start_location} → {item.end_location}
                        </AppText>
                        <AppText style={styles.cardSub}>
                            Giờ: {item.time} | Ghế: {item.seats} | Giá: {item.price}
                        </AppText>
                        {item.route_status ? (
                            <AppText style={styles.badge}>Trạng thái: {item.route_status}</AppText>
                        ) : null}
                    </Pressable>
                )
                }
            />
        </Screen >
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

    card: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#fff",
    },
    pressed: { opacity: 0.85 },
    cardTitle: { fontSize: 15, fontWeight: "800" },
    cardSub: { marginTop: 4, fontSize: 13, opacity: 0.75 },
    badge: { marginTop: 6, fontSize: 12, opacity: 0.8 },
});
