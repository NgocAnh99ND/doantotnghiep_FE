import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AuthLayout from "../../layouts/AuthLayout";
import { AppButton, AppInput, ErrorState } from "../../components";
import { useAuth } from "../../store/authStore";
import { normalizePhone, isValidName, isValidPassword, isValidPhone } from "../../utils/validators";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";
import { homeByRole } from "../../services/guards";

type RolePick = "PASSENGER" | "DRIVER";

export default function RegisterPage() {
  const router = useRouter();
  const { registerAndLogin } = useAuth();

  const [userName, setUserName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<RolePick>("PASSENGER");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = isValidName(userName) && isValidPhone(phone) && isValidPassword(password) && !loading;

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await registerAndLogin({
        user_name: userName.trim(),
        phone: normalizePhone(phone),
        password,
        role,
      });
      router.replace(homeByRole(user.role));
    } catch (e: any) {
      setError(e?.message ?? "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Đăng ký">
      <ErrorState message={error} />

      <AppInput label="Họ và tên" value={userName} onChangeText={setUserName} placeholder="Nguyễn Văn A" />

      <AppInput label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="0901000000" keyboardType="phone-pad" />

      <AppInput label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="******" secureTextEntry />

      <View style={styles.roleWrap}>
        <Text style={typography.sub}>Bạn là</Text>
        <View style={styles.roleRow}>
          <Pressable onPress={() => setRole("PASSENGER")} style={[styles.roleBtn, role === "PASSENGER" && styles.roleActive]}>
            <Text style={[styles.roleText, role === "PASSENGER" && styles.roleTextActive]}>Hành khách</Text>
          </Pressable>
          <Pressable onPress={() => setRole("DRIVER")} style={[styles.roleBtn, role === "DRIVER" && styles.roleActive]}>
            <Text style={[styles.roleText, role === "DRIVER" && styles.roleTextActive]}>Tài xế</Text>
          </Pressable>
        </View>
      </View>

      <AppButton title={loading ? "Đang tạo..." : "Tạo tài khoản"} onPress={onSubmit} disabled={!canSubmit} />

      <View style={styles.footer}>
        <Text style={typography.sub}>Đã có tài khoản?</Text>
        <Pressable onPress={() => router.push("/(auth)/login")}>
          <Text style={typography.link}>Đăng nhập</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  roleWrap: { gap: 8 },
  roleRow: { flexDirection: "row", gap: 10 },
  roleBtn: {
    flex: 1,
    borderRadius: theme.radius.xl,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  roleActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  roleText: { textAlign: "center", fontWeight: "700", color: theme.colors.text },
  roleTextActive: { color: theme.colors.primaryText },
  footer: { flexDirection: "row", justifyContent: "center", gap: 8, alignItems: "center" },
});
