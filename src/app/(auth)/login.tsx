// src/app/(auth)/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LoginMethod = "phone" | "email";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function AuthInput(props: {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
  leftIcon?: React.ComponentProps<typeof Ionicons>["name"];
  right?: React.ReactNode;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  textContentType?: any;
}) {
  const {
    label,
    placeholder,
    value,
    onChangeText,
    keyboardType = "default",
    secureTextEntry,
    leftIcon,
    right,
    autoCapitalize = "none",
    textContentType,
  } = props;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        {label}
      </Text>

      <View className="flex-row items-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        {leftIcon ? (
          <View className="mr-3">
            <Ionicons
              name={leftIcon}
              size={18}
              color={Platform.OS === "android" ? "#6B7280" : "#6B7280"}
            />
          </View>
        ) : null}

        <TextInput
          className="flex-1 text-base text-neutral-900 dark:text-neutral-100"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          textContentType={textContentType}
        />

        {right ? <View className="ml-2">{right}</View> : null}
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();

  const [method, setMethod] = useState<LoginMethod>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  const canSubmit = useMemo(() => {
    const idOk =
      method === "phone" ? phone.trim().length >= 9 : email.trim().includes("@");
    return idOk && password.trim().length >= 6;
  }, [method, phone, email, password]);

  const handleLogin = () => {
    // UI-only: sau này bạn thay bằng gọi API + lưu token
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* ✅ Cách 2: bọc View bên trong để dùng className thay contentContainerClassName */}
          <View className="px-5 pb-10">
            {/* Header */}
            <View className="mt-4">
              <View className="flex-row items-center">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 dark:bg-neutral-100">
                  <Ionicons
                    name="car-sport"
                    size={22}
                    color={Platform.OS === "android" ? "#fff" : "#fff"}
                  />
                </View>

                <View className="ml-3">
                  <Text className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
                    Tiện Chuyến
                  </Text>
                  <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                    Đi chung • Tiết kiệm • An toàn
                  </Text>
                </View>
              </View>

              <Text className="mt-6 text-2xl font-extrabold text-red-900 dark:text-neutral-100">
                Đăng nhập
              </Text>
              <Text className="mt-2 text-base text-red-600 dark:text-neutral-400">
                Chào mừng bạn quay lại. Hãy đăng nhập để tiếp tục.
              </Text>
            </View>

            {/* Switch method */}
            <View className="mt-6 flex-row rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-900">
              <Pressable
                onPress={() => setMethod("phone")}
                className={cn(
                  "flex-1 items-center rounded-2xl py-3",
                  method === "phone" && "bg-white shadow-sm dark:bg-neutral-950"
                )}
              >
                <Text
                  className={cn(
                    "text-sm font-semibold",
                    method === "phone"
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-500 dark:text-neutral-400"
                  )}
                >
                  Số điện thoại
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMethod("email")}
                className={cn(
                  "flex-1 items-center rounded-2xl py-3",
                  method === "email" && "bg-white shadow-sm dark:bg-neutral-950"
                )}
              >
                <Text
                  className={cn(
                    "text-sm font-semibold",
                    method === "email"
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-500 dark:text-neutral-400"
                  )}
                >
                  Email
                </Text>
              </Pressable>
            </View>

            {/* Inputs */}
            <View className="mt-6">
              {method === "phone" ? (
                <AuthInput
                  label="Số điện thoại"
                  placeholder="Ví dụ: 0912345678"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                  autoCapitalize="none"
                  textContentType="telephoneNumber"
                />
              ) : (
                <AuthInput
                  label="Email"
                  placeholder="Ví dụ: ban@domain.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  leftIcon="mail-outline"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                />
              )}

              <AuthInput
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                leftIcon="lock-closed-outline"
                autoCapitalize="none"
                textContentType="password"
                right={
                  <Pressable
                    onPress={() => setShowPw((s) => !s)}
                    className="rounded-xl px-2 py-1"
                  >
                    <Ionicons
                      name={showPw ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#6B7280"
                    />
                  </Pressable>
                }
              />

              <View className="mb-2 flex-row items-center justify-between">
                <Pressable
                  onPress={() => setRemember((v) => !v)}
                  className="flex-row items-center"
                >
                  <View
                    className={cn(
                      "h-5 w-5 items-center justify-center rounded-md border",
                      remember
                        ? "border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100"
                        : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-950"
                    )}
                  >
                    {remember ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={remember ? "#fff" : "#000"}
                      />
                    ) : null}
                  </View>
                  <Text className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                    Ghi nhớ đăng nhập
                  </Text>
                </Pressable>

                <Pressable onPress={() => {}} className="rounded-xl px-2 py-1">
                  <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Quên mật khẩu?
                  </Text>
                </Pressable>
              </View>

              {/* Login button */}
              <Pressable
                onPress={handleLogin}
                disabled={!canSubmit}
                className={cn(
                  "mt-4 items-center rounded-2xl py-4",
                  canSubmit
                    ? "bg-neutral-900 dark:bg-neutral-100"
                    : "bg-neutral-300 dark:bg-neutral-800"
                )}
              >
                <Text
                  className={cn(
                    "text-base font-bold",
                    canSubmit
                      ? "text-white dark:text-neutral-900"
                      : "text-neutral-600 dark:text-neutral-400"
                  )}
                >
                  Đăng nhập
                </Text>
              </Pressable>

              {/* Divider */}
              <View className="my-6 flex-row items-center">
                <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                <Text className="mx-3 text-sm text-neutral-500 dark:text-neutral-400">
                  hoặc
                </Text>
                <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              </View>

              {/* Social buttons (UI only) */}
              <View className="flex-row gap-3">
                <Pressable className="flex-1 flex-row items-center justify-center rounded-2xl border border-neutral-200 bg-white py-3 dark:border-neutral-800 dark:bg-neutral-950">
                  <Ionicons name="logo-google" size={18} color="#111827" />
                  <Text className="ml-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Google
                  </Text>
                </Pressable>

                <Pressable className="flex-1 flex-row items-center justify-center rounded-2xl border border-neutral-200 bg-white py-3 dark:border-neutral-800 dark:bg-neutral-950">
                  <Ionicons name="logo-apple" size={18} color="#111827" />
                  <Text className="ml-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Apple
                  </Text>
                </Pressable>
              </View>

              {/* Register */}
              <View className="mt-8 flex-row items-center justify-center">
                <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                  Chưa có tài khoản?
                </Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable className="ml-2 rounded-xl px-2 py-1">
                    <Text className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                      Đăng ký
                    </Text>
                  </Pressable>
                </Link>
              </View>

              {/* Terms */}
              <Text className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-500">
                Bằng việc đăng nhập, bạn đồng ý với Điều khoản & Chính sách của
                Tiện Chuyến.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
