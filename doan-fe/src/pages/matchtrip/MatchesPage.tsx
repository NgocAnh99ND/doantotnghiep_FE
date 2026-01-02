import React from "react";
import { View, FlatList, Pressable, Alert, StyleSheet } from "react-native";
import { useAuth } from "@/store/authStore";
import { AppText } from "@/components";
import { routeApi } from "@/api/route";
import { matchTripApi } from "@/api/matchtrip/matchtrip.api";
import { useFetchMatchesByPassenger, useFetchMatchesByRoute } from "@/api/matchtrip/useFetch";
import type { MatchTripStatus } from "@/api/matchtrip/typeds";

type RouteItem = {
    route_id: number;
    driver_id: number;
    start_location: string;
    end_location: string;
    time: string;
    seats: number;
    price: number;
    route_status: string;
};

const STATUS: MatchTripStatus[] = ["PENDING", "ACCEPTED", "REJECTED", "FINISHED", "CANCELLED"];

export default function MatchesPage() {
    const { status, user } = useAuth();

    if (status !== "authed" || !user) {
        return (
            <View style={styles.container}>
                <AppText>Bạn chưa đăng nhập.</AppText>
            </View>
        );
    }

    if (user.role === "PASSENGER") {
        const passengerId = (user as any).passenger_id as number | undefined;
        const { data, loading, error, refetch } = useFetchMatchesByPassenger(passengerId);

        return (
            <View style={styles.container}>
                <AppText style={styles.h1}>Matches của bạn</AppText>

                {error ? <AppText style={styles.err}>Lỗi: {String(error?.message ?? error)}</AppText> : null}

                <FlatList
                    data={data}
                    keyExtractor={(it) => String(it.match_id)}
                    onRefresh={refetch}
                    refreshing={loading}
                    contentContainerStyle={{ paddingTop: 12, gap: 10, paddingBottom: 20 }}
                    ListEmptyComponent={!loading ? <AppText>Chưa có match nào.</AppText> : null}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <AppText style={styles.cardTitle}>Match #{item.match_id}</AppText>
                            <AppText>Route: {item.route_id ?? "-"}</AppText>
                            <AppText>Trạng thái: {item.match_trip_status}</AppText>
                        </View>
                    )}
                />
            </View>
        );
    }

    // DRIVER
    return <DriverMatchesView driverUserId={user.user_id} />;
}

function DriverMatchesView({ driverUserId }: { driverUserId: number }) {
    const [routes, setRoutes] = React.useState<RouteItem[]>([]);
    const [routesLoading, setRoutesLoading] = React.useState(false);
    const [selectedRouteId, setSelectedRouteId] = React.useState<number | null>(null);

    const { data, loading, error, refetch } = useFetchMatchesByRoute(selectedRouteId ?? undefined);

    const ROUTE_CARD_HEIGHT = 130; // bạn có thể chỉnh 88-110 tuỳ UI
    const ROUTE_GAP = 10;

    const loadMyRoutes = React.useCallback(async () => {
        setRoutesLoading(true);
        try {
            const all = (await routeApi.fetchAll()) as RouteItem[];
            const mine = all.filter((r) => r.driver_id === driverUserId);
            setRoutes(mine);
            if (!selectedRouteId && mine.length > 0) setSelectedRouteId(mine[0].route_id);
        } finally {
            setRoutesLoading(false);
        }
    }, [driverUserId, selectedRouteId]);

    React.useEffect(() => {
        loadMyRoutes();
    }, [loadMyRoutes]);

    const changeStatus = React.useCallback(
        async (match_id: number, match_trip_status: MatchTripStatus) => {
            try {
                await matchTripApi.updateStatus({ match_id, match_trip_status });
                await refetch();
            } catch (e: any) {
                Alert.alert("Lỗi", e?.message ?? "Không thể cập nhật trạng thái");
            }
        },
        [refetch]
    );

    return (
        <View style={styles.container}>
            <AppText style={styles.h1}>Matches (Driver)</AppText>

            <AppText style={styles.h2}>Chọn route của bạn</AppText>

            <View style={styles.routeWrapperOuter}>
                <View style={styles.routeWrapperInner}>
                    <FlatList
                        data={routes}
                        keyExtractor={(it) => String(it.route_id)}
                        refreshing={routesLoading}
                        onRefresh={loadMyRoutes}
                        style={[styles.routeListBox, { maxHeight: ROUTE_CARD_HEIGHT * 2 + ROUTE_GAP }]} // ✅ chỉ cao đủ 2 card
                        contentContainerStyle={styles.routeList}
                        ItemSeparatorComponent={() => <View style={{ height: ROUTE_GAP }} />}
                        showsVerticalScrollIndicator={true}
                        ListEmptyComponent={!routesLoading ? <AppText>Bạn chưa có route OPEN nào.</AppText> : null}
                        renderItem={({ item }) => {
                            const active = item.route_id === selectedRouteId;
                            return (
                                <Pressable
                                    onPress={() => setSelectedRouteId(item.route_id)}
                                    style={[
                                        styles.routeItem,
                                        { height: ROUTE_CARD_HEIGHT },          // ✅ card cao cố định
                                        active && styles.routeItemActive,
                                    ]}
                                >
                                    <AppText style={styles.routeTitle} numberOfLines={2}>
                                        #{item.route_id}: {item.start_location} → {item.end_location}
                                    </AppText>

                                    <AppText style={styles.routeSub} numberOfLines={1}>Giờ: {item.time}</AppText>
                                    <AppText style={styles.routeSub} numberOfLines={1}>Giá: {item.price}</AppText>
                                </Pressable>
                            );
                        }}
                    />
                </View>
            </View>

            <AppText style={[styles.h2, { marginTop: 8 }]}>Danh sách match theo route</AppText>
            {error ? <AppText style={styles.err}>Lỗi: {String(error?.message ?? error)}</AppText> : null}

            <FlatList
                data={data}
                keyExtractor={(it) => String(it.match_id)}
                onRefresh={refetch}
                refreshing={loading}
                contentContainerStyle={{ paddingTop: 12, gap: 10, paddingBottom: 20 }}
                ListEmptyComponent={!loading ? <AppText>Chưa có match nào cho route này.</AppText> : null}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <AppText style={styles.cardTitle}>Match #{item.match_id}</AppText>
                        <AppText>Ride request: {item.ride_request_id ?? "-"}</AppText>
                        <AppText>Trạng thái: {item.match_trip_status}</AppText>

                        <View style={styles.statusRow}>
                            {STATUS.map((s) => (
                                <Pressable key={s} style={styles.smallBtn} onPress={() => changeStatus(item.match_id, s)}>
                                    <AppText style={styles.smallBtnText}>{s}</AppText>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 8 },
    h1: { fontSize: 20, fontWeight: "800" },
    h2: { fontSize: 16, fontWeight: "800" },
    err: { color: "crimson" },

    card: { padding: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 12, gap: 6, backgroundColor: "#fff" },
    cardTitle: { fontSize: 16, fontWeight: "800" },

    routeListBox: {
        borderRadius: 14,
        maxHeight: 270,
    },

    routeList: {
        paddingVertical: 10,
    },

    routeItem: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#eee",
        backgroundColor: "#fff",
        justifyContent: "center", // ✅ để text nằm gọn trong chiều cao cố định
    },

    routeItemActive: {
        borderColor: "#111",
        backgroundColor: "#f8f8f8",
    },

    routeTitle: {
        fontSize: 15,
        fontWeight: "800",
    },

    routeSub: {
        marginTop: 4,
        opacity: 0.75,
    },

    routeWrapperOuter: {
        height: 331,          // ✅ wrapper ngoài = 331
        maxHeight: 331,
        overflow: "hidden",   // ❗ bắt buộc để không phình
    },

    routeWrapperInner: {
        height: 331,          // ✅ wrapper trong = 331
        maxHeight: 331,
        overflow: "hidden",
    },

    routeContent: {
        paddingVertical: 10,
        gap: 10,
    },


    statusRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 },
    smallBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: "#ddd" },
    smallBtnText: { fontSize: 12, fontWeight: "800" },
});
