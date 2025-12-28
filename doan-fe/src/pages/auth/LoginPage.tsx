import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AuthLayout from "../../layouts/AuthLayout";
import { AppButton, AppInput, ErrorState } from "../../components";
import { useAuth } from "../../store/authStore";
import { normalizePhone, isValidPassword, isValidPhone } from "../../utils/validators";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";
import { homeByRole } from "../../services/guards";

export default function LoginPage() {
  const router = useRouter();
  const { login, lastPhone, clearRememberedPhone } = useAuth();

  const [phone, setPhone] = React.useState(lastPhone ?? "");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => { setPhone(lastPhone ?? ""); }, [lastPhone]);

  const needPhone = !lastPhone;
  const canSubmit = (needPhone ? isValidPhone(phone) : true) && isValidPassword(password) && !loading;

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const usedPhone = normalizePhone(needPhone ? phone : lastPhone!);
      const user = await login(usedPhone, password);
      router.replace(homeByRole(user.role));
    } catch (e: any) {
      setError(e?.message ?? "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Đăng nhập">
      <ErrorState message={error} />

      {needPhone ? (
        <AppInput
          label="Số điện thoại"
          value={phone}
          onChangeText={setPhone}
          placeholder="0901000000"
          keyboardType="phone-pad"
        />
      ) : (
        <View style={styles.rememberBox}>
          <Text style={typography.sub}>Số điện thoại</Text>
          <Text style={styles.rememberPhone}>{lastPhone}</Text>
          <Pressable onPress={clearRememberedPhone} style={styles.changeBtn}>
            <Text style={typography.link}>Đổi tài khoản</Text>
          </Pressable>
        </View>
      )}

      <AppInput
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        placeholder="******"
        secureTextEntry
      />

      <AppButton
        title={loading ? "Đang đăng nhập..." : "Đăng nhập"}
        onPress={onSubmit}
        disabled={!canSubmit}
      />

      <View style={styles.footer}>
        <Text style={typography.sub}>Chưa có tài khoản?</Text>
        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text style={typography.link}>Đăng ký</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  rememberBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 6,
  },
  rememberPhone: { fontSize: 16, fontWeight: "800", color: theme.colors.text },
  changeBtn: { marginTop: 4 },
  footer: { flexDirection: "row", justifyContent: "center", gap: 8, alignItems: "center" },
});
