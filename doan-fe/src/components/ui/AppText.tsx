import React from "react";
import { Text, TextProps } from "react-native";
import { typography } from "../../styles/typography";

export default function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[typography.body, style]} />;
}
