import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label?: string;
  leftText?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap; // "eye" | "eye-off" ...
  onPressRightIcon?: () => void;
};

export default function AppInput({
  label,
  leftText,
  rightIcon,
  onPressRightIcon,
  className,
  ...props
}: Props) {
  return (
    <View>
      {label ? <Text className="text-zinc-300 mb-2">{label}</Text> : null}

      <View className="flex-row items-center rounded-2xl border border-white/10 bg-zinc-900/50 px-3">
        {leftText ? (
          <>
            <Text className="text-zinc-300">{leftText}</Text>
            <View className="mx-3 h-6 w-px bg-white/10" />
          </>
        ) : null}

        <TextInput
          placeholderTextColor="#71717A"
          className={`flex-1 py-3 text-white ${className ?? ""}`}
          {...props}
        />

        {rightIcon ? (
          <Pressable onPress={onPressRightIcon} hitSlop={10} className="py-2 pl-2">
            <Ionicons name={rightIcon} size={18} color="#A1A1AA" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
