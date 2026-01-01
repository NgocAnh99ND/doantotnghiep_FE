import React, { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, AppText, Divider, Loading, AppButton } from "@/components";
import { useFetchRequestsByPassenger } from "@/api/riderequest";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/store/authStore";


export default function RequestListPage() {
    const router = useRouter();

    // TODO: sau này lấy passengerId từ authStore
    const { user } = useAuth();

    /* =========================
     * 1. Guard: chưa login
     * ========================= */
    if (!user) {
        return (
            <Screen>
                <AppText>Bạn chưa đăng nhập</AppText>
            </Screen>
        );
    }

    /* =========================
     * 2. Guard: sai role
     * ========================= */
    if (user.role !== "PASSENGER") {
        return (
            <Screen>
                <AppText>Tài khoản này không phải hành khách</AppText>
            </Screen>
        );
    }

    /* =========================
     * 3. Guard: thiếu passenger_id
     * ========================= */
    const passengerId = user.passenger_id ?? null;

    if (!passengerId) {
        return (
            <Screen>
                <AppText>Không tìm thấy thông tin hành khách</AppText>
            </Screen>
        );
    }

    /* =========================
     * 4. Fetch data
     * ========================= */
    const { data, loading, error, refetch } =
        useFetchRequestsByPassenger(passengerId);

    /* =========================
     * 5. Refetch khi quay lại tab
     * ========================= */
    // useFocusEffect(
    //     useCallback(() => {
    //         refetch();
    //     }, [refetch])
    // );


    return (
        <Screen>
            <View style={styles.header}>
                <AppText style={styles.h1}>Yêu cầu đi xe</AppText>
                <AppText style={styles.sub}>Danh sách yêu cầu của bạn</AppText>
            </View>

            <Divider />

            {loading ? <Loading /> : null}

            {error ? (
                <View style={styles.box}>
                    <AppText style={styles.errTitle}>Không tải được danh sách</AppText>
                    <AppText style={styles.errSub}>{String((error as any)?.message ?? error)}</AppText>
                    <Pressable onPress={refetch} style={styles.retryBtn}>
                        <AppText style={styles.retryText}>Tải lại</AppText>
                    </Pressable>
                </View>
            ) : null}

            <FlatList
                data={data}
                keyExtractor={(item) => String(item.ride_request_id)}
                contentContainerStyle={styles.listContent}
                onRefresh={refetch}
                refreshing={loading}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.push(`/request/${item.ride_request_id}` as any)}
                        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                    >
                        <AppText style={styles.cardTitle}>
                            {item.pick_up} → {item.drop_off}
                        </AppText>
                        <AppText style={styles.cardSub}>
                            Giờ: {item.time} | Số người: {item.passengers}
                        </AppText>
                        {item.status ? <AppText style={styles.badge}>Trạng thái: {item.status}</AppText> : null}
                    </Pressable>
                )}
                ListFooterComponent={
                    <View style={styles.footer}>
                        <AppButton title="Tạo yêu cầu" onPress={() => router.push("/request/create" as any)} />
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <AppText style={styles.emptyTitle}>Chưa có yêu cầu nào</AppText>
                            <AppText style={styles.emptySub}>Bấm “Tạo yêu cầu” để bắt đầu.</AppText>
                        </View>
                    ) : null
                }
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: { gap: 6, paddingBottom: 8 },
    h1: { fontSize: 20, fontWeight: "800" },
    sub: { fontSize: 13, opacity: 0.7 },

    listContent: {
        flexGrow: 1, // ✅ để footer dính đáy màn hình khi ít item
        paddingTop: 12,
        gap: 10,
        paddingBottom: 12,
    },

    footer: {
        marginTop: "auto", // ✅ đẩy footer xuống đáy
        paddingTop: 10,
    },

    empty: { paddingTop: 16, gap: 6 },
    emptyTitle: { fontWeight: "800" },
    emptySub: { opacity: 0.7 },

    box: { paddingTop: 12, gap: 6 },
    errTitle: { fontWeight: "800" },
    errSub: { opacity: 0.75 },
    retryBtn: { paddingVertical: 10 },
    retryText: { fontWeight: "800" },

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
