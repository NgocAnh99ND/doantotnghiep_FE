import React from "react";
import { SafeAreaView } from "react-native";

export default function ScreenWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <SafeAreaView className={className}>{children}</SafeAreaView>;
}
