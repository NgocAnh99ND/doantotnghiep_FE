import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function AppButton({ title, onPress, disabled, loading }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-12 rounded-2xl items-center justify-center ${
        disabled ? "bg-indigo-500/30" : "bg-indigo-500"
      }`}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text className="text-white font-bold text-base">{title}</Text>
      )}
    </Pressable>
  );
}
