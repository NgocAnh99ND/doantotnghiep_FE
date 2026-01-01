import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen, AppText, AppButton, Divider } from "@/components";
import { useAuth } from "@/store/authStore";

export default function ProfilePage() {
    const router = useRouter();
    const { status, user, logout } = useAuth();

    const onLogout = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn chắc chắn muốn đăng xuất?",
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Đăng xuất",
                    onPress: () => {
                        logout();
                        router.replace("/");
                    },
                },

            ],
            { cancelable: true }
        );
    };

    if (status === "loading") {
        return (
            <Screen>
                <AppText>Đang tải...</AppText>
            </Screen>
        );
    }

    if (!user) {
        return (
            <Screen>
                <AppText style={styles.h1}>Profile</AppText>
                <Divider />
                <AppText>Bạn chưa đăng nhập.</AppText>
            </Screen>
        );
    }

    return (
        <Screen>
            <AppText style={styles.h1}>Tài khoản</AppText>
            <AppText style={styles.sub}>Thông tin đăng nhập</AppText>
            <Divider />

            <View style={styles.card}>
                <Row label="User ID" value={String(user.user_id)} />
                <Row label="Tên" value={user.user_name} />
                <Row label="SĐT" value={user.phone} />
                <Row label="Vai trò" value={user.role} />
                {"passenger_id" in user && user.role === "PASSENGER" ? (
                    <Row label="Passenger ID" value={String((user as any).passenger_id ?? "")} />
                ) : null}
            </View>

            <View style={{ height: 12 }} />
            <AppButton title="Đăng xuất" onPress={onLogout} />
        </Screen>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <AppText style={styles.label}>{label}</AppText>
            <AppText style={styles.value}>{value}</AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    h1: { fontSize: 20, fontWeight: "900" },
    sub: { marginTop: 6, fontSize: 13, opacity: 0.7 },

    card: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        padding: 14,
        gap: 10,
        backgroundColor: "#fff",
    },
    row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
    label: { opacity: 0.7 },
    value: { fontWeight: "800" },
});
