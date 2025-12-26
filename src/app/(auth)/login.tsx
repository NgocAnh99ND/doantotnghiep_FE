import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

function maskPhone(phoneE164: string) {
  const digits = phoneE164.replace(/\D/g, "");
  if (digits.length < 6) return phoneE164;
  const last3 = digits.slice(-3);
  const prefix = phoneE164.startsWith("+84") ? "+84" : phoneE164.slice(0, 3);
  return `${prefix} ••• ••• ${last3}`;
}

export default function Login() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [savedPhoneE164, setSavedPhoneE164] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await AsyncStorage.getItem(STORAGE_KEYS.PHONE_E164);
        if (!p) {
          // ✅ Lần đầu vào app → chuyển sang register (đúng yêu cầu)
          router.replace("/(auth)/register");
          return;
        }
        setSavedPhoneE164(p);
      } finally {
        setBooting(false);
      }
    })();
  }, [router]);

  const canSubmit = useMemo(() => {
    if (booting || submitting) return false;
    if (!savedPhoneE164) return false;
    return password.trim().length >= 6;
  }, [booting, submitting, savedPhoneE164, password]);

  const onPressContinue = async () => {
    if (!canSubmit) return;

    setErrorText(null);
    setSubmitting(true);
    try {
      // TODO: gọi API login của bạn tại đây
      // await authService.login({ phone: savedPhoneE164!, password })

      router.replace("/(tabs)/home");
    } catch (e: any) {
      setErrorText(e?.message ?? "Mật khẩu không đúng hoặc có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  };

  const onChangePhone = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.PHONE_E164);
    setSavedPhoneE164(null);
    setPassword("");
    setErrorText(null);
    router.replace("/(auth)/register");
  };

  if (booting) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" className="flex-1">
          <View className="px-5 pt-10 pb-28">
            <View className="items-center">
              <Text className="text-5xl font-extrabold text-white">
                tiện chuyến
              </Text>
              <Text className="mt-4 text-base text-slate-200">
                Những lần sau chỉ cần nhập mật khẩu
              </Text>
            </View>

            {/* Hiển thị số đã lưu + đổi số */}
            <View className="mt-8 flex-row items-center justify-between rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-4">
              <View>
                <Text className="text-xs text-slate-300">Số điện thoại</Text>
                <Text className="mt-1 text-base font-semibold text-slate-100">
                  {savedPhoneE164 ? maskPhone(savedPhoneE164) : ""}
                </Text>
              </View>

              <Pressable
                onPress={onChangePhone}
                className="rounded-xl px-3 py-2"
              >
                <Text className="text-sm font-semibold text-sky-300">
                  Đổi số
                </Text>
              </Pressable>
            </View>

            {/* Password */}
            <View className="mt-5">
              <Text className="mb-2 text-sm text-slate-300">Mật khẩu</Text>
              <View className="flex-row items-center rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-4">
                <TextInput
                  className="flex-1 text-base text-white"
                  placeholder="Nhập mật khẩu"
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

            {errorText ? (
              <Text className="mt-4 text-sm text-red-300">{errorText}</Text>
            ) : null}

            <Pressable
              onPress={() => {}}
              className="mt-4 self-end rounded-xl px-2 py-2"
            >
              <Text className="text-sm font-semibold text-sky-300 underline">
                Quên mật khẩu?
              </Text>
            </Pressable>
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
