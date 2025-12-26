import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STORAGE_KEYS = {
  PHONE_E164: "auth_phone_e164",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeVNPhoneToE164(input: string) {
  const raw = input.trim().replace(/\s+/g, "");
  if (!raw) return "";

  if (raw.startsWith("+")) return raw;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("0")) return `+84${digits.slice(1)}`;
  if (digits.startsWith("84")) return `+${digits}`;
  return `+84${digits}`;
}

export default function Register() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [promo, setPromo] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const phoneE164 = useMemo(() => normalizeVNPhoneToE164(phone), [phone]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;

    const p = phoneE164;
    const digits = p.replace(/\D/g, "");

    const phoneOk = p.startsWith("+84") && digits.length >= 11; // VN thường 10 số nội địa => +84 + 9/10 số
    const pwOk = password.trim().length >= 6;

    return phoneOk && pwOk;
  }, [submitting, phoneE164, password]);

  const onPressContinue = async () => {
    if (!canSubmit) return;

    setErrorText(null);
    setSubmitting(true);
    try {
      // TODO: gọi API register của bạn tại đây
      // await authService.register({ phone: phoneE164, password, promoCode: promo || undefined })

      // Demo logic: lưu số vào máy để lần sau chỉ hỏi mật khẩu
      await AsyncStorage.setItem(STORAGE_KEYS.PHONE_E164, phoneE164);

      // Sau đăng ký thành công → vào app
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setErrorText(e?.message ?? "Đăng ký thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" className="flex-1">
          <View className="px-5 pt-10 pb-28">
            {/* Logo / Title */}
            <View className="items-center">
              <Text className="text-5xl font-extrabold text-white">
                tiện chuyến
              </Text>
              <Text className="mt-4 text-base text-slate-200">
                Xin vui lòng đăng ký bằng số điện thoại
              </Text>
            </View>

            {/* Country row */}
            <Pressable
              className="mt-8 flex-row items-center justify-between rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-4"
              onPress={() => {}}
            >
              <View className="flex-row items-center">
                <Text className="mr-3 text-lg">🇻🇳</Text>
                <Text className="text-base font-semibold text-slate-100">
                  Việt Nam
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            {/* Phone */}
            <View className="mt-6">
              <Text className="mb-2 text-sm text-slate-300">Số điện thoại</Text>
              <View className="flex-row items-center rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-4">
                <Text className="mr-3 text-base font-semibold text-slate-100">
                  +84
                </Text>
                <TextInput
                  className="flex-1 text-base text-white"
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Password */}
            <View className="mt-5">
              <Text className="mb-2 text-sm text-slate-300">Mật khẩu</Text>
              <View className="flex-row items-center rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-4">
                <TextInput
                  className="flex-1 text-base text-white"
                  placeholder="Nhập mật khẩu (>= 6 ký tự)"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  onPress={() => setShowPw((s) => !s)}
                  className="ml-2 rounded-xl px-2 py-1"
                >
                  <Ionicons
                    name={showPw ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#94A3B8"
                  />
                </Pressable>
              </View>
            </View>

            {/* Promo */}
            <View className="mt-5">
              <Text className="mb-2 text-sm text-slate-300">
                Mã khuyến mãi, nếu có
              </Text>
              <View className="rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-4">
                <TextInput
                  className="text-base text-white"
                  placeholder="Nhập mã (không bắt buộc)"
                  placeholderTextColor="#94A3B8"
                  value={promo}
                  onChangeText={setPromo}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {errorText ? (
              <Text className="mt-4 text-sm text-red-300">{errorText}</Text>
            ) : null}

            {/* Terms */}
            <Text className="mt-8 text-center text-sm text-slate-300">
              Bằng cách xác nhận số điện thoại, tôi đồng ý với{" "}
              <Text className="text-sky-300 underline">quy tắc làm việc</Text>{" "}
              của dịch vụ và{" "}
              <Text className="text-sky-300 underline">
                chính sách xử lý dữ liệu cá nhân
              </Text>
              .
            </Text>

            {/* Link to login (tùy bạn dùng) */}
            <View className="mt-6 items-center">
              <Link href="/(auth)/login" asChild>
                <Pressable className="rounded-xl px-3 py-2">
                  <Text className="text-sm font-semibold text-sky-300 underline">
                    Đã có số? Nhập mật khẩu
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>

        {/* Bottom button */}
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-6">
          <Pressable
            onPress={onPressContinue}
            disabled={!canSubmit}
            className={cn(
              "items-center justify-center rounded-3xl py-5",
              canSubmit ? "bg-yellow-400" : "bg-yellow-400/40"
            )}
          >
            {submitting ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-lg font-semibold text-slate-900">
                Tiếp tục
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
