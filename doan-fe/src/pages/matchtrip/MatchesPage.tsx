import React from "react";
import { View, FlatList, Pressable, Alert, StyleSheet, TextInput } from "react-native";
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

/** format 150000 -> 150.000 */
function formatWithDots(rawDigits: string) {
    if (!rawDigits) return "";
    const digits = rawDigits.replace(/\D/g, "");
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** lấy digits từ input (bỏ . và ký tự khác) */
function toDigits(text: string) {
    return (text ?? "").replace(/\D/g, "");
}

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

                {error ? <AppText style={styles.err}>Lỗi: {String((error as any)?.message ?? error)}</AppText> : null}

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

    const ROUTE_CARD_HEIGHT = 130;
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
            <CreateRouteBox driverId={driverUserId} onCreated={loadMyRoutes} />

            <AppText style={[styles.h2, { marginTop: 8 }]}>Danh sách match theo route</AppText>
            {error ? <AppText style={styles.err}>Lỗi: {String((error as any)?.message ?? error)}</AppText> : null}

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

function CreateRouteBox({
    driverId,
    onCreated,
}: {
    driverId: number;
    onCreated: () => Promise<void> | void;
}) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const [startLocation, setStartLocation] = React.useState("");
    const [endLocation, setEndLocation] = React.useState("");
    const [time, setTime] = React.useState("");
    const [seats, setSeats] = React.useState("4");

    // ✅ priceRaw: lưu digits "150000" (KHÔNG dấu .)
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
        const priceNum = Number(priceRaw); // ✅ raw digits -> number

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

            await onCreated();

            Alert.alert("Thành công", "Đã đăng tuyến xe.");
            reset();
            setOpen(false);
        } catch (e: any) {
            Alert.alert("Lỗi", e?.message ?? "Không thể đăng tuyến");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.createBox}>
            <View>
                <AppText style={styles.h2}>Đăng tuyến xe</AppText>
            </View>
            <View style={{ gap: 10 }}>
                <TextInput
                    value={startLocation}
                    onChangeText={setStartLocation}
                    placeholder="Điểm đi (start_location)"
                    style={styles.input}
                />
                <TextInput
                    value={endLocation}
                    onChangeText={setEndLocation}
                    placeholder="Điểm đến (end_location)"
                    style={styles.input}
                />
                <TextInput
                    value={time}
                    onChangeText={setTime}
                    placeholder='Thời gian (vd "2025-01-10 08:00")'
                    style={styles.input}
                />

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
        justifyContent: "center",
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
        height: 331,
        maxHeight: 331,
        overflow: "hidden",
    },

    routeWrapperInner: {
        height: 331,
        maxHeight: 331,
        overflow: "hidden",
    },

    createBox: {
        marginTop: 10,
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
    btn: {
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#111",
        alignItems: "center",
    },
    btnText: { fontWeight: "800" },

    statusRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 },
    smallBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: "#ddd" },
    smallBtnText: { fontSize: 12, fontWeight: "800" },
});
