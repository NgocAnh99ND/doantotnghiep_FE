import React from "react";
import { Text, Pressable, StyleSheet, View } from "react-native";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../store/authStore";
import { theme } from "../../styles/theme";

export default function HomePage() {
  const { user, logout, clearRememberedPhone } = useAuth();

  return (
    <MainLayout title="Trang chủ">
      <View style={styles.card}>
        <Text style={styles.hi}>Xin chào {user.user_name}</Text>
        <Text style={styles.sub}>Role: {user.role}</Text>
        <Text style={styles.sub}>Phone: {user.phone}</Text>
      </View>

      <Pressable onPress={logout} style={styles.btn}>
        <Text style={styles.btnText}>Đăng xuất</Text>
      </Pressable>

      <Pressable onPress={clearRememberedPhone} style={styles.btnGhost}>
        <Text style={styles.btnGhostText}>Xoá số đã nhớ (đổi tài khoản)</Text>
      </Pressable>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xl, padding: theme.spacing.md, gap: 6 },
  hi: { fontSize: 18, fontWeight: "800", color: theme.colors.text },
  sub: { color: theme.colors.subtext },
  btn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.xl, paddingVertical: 12, marginTop: theme.spacing.sm },
  btnText: { color: theme.colors.primaryText, textAlign: "center", fontWeight: "800" },
  btnGhost: { borderRadius: theme.radius.xl, paddingVertical: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card, marginTop: 10 },
  btnGhostText: { textAlign: "center", fontWeight: "700", color: theme.colors.text },
});
