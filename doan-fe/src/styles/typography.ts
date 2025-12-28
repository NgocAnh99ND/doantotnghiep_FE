import { StyleSheet } from "react-native";
import { theme } from "./theme";

export const typography = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "700", color: theme.colors.text },
  h2: { fontSize: 18, fontWeight: "700", color: theme.colors.text },
  body: { fontSize: 14, color: theme.colors.text },
  sub: { fontSize: 13, color: theme.colors.subtext },
  link: { fontSize: 14, color: "#2563EB", fontWeight: "600" },
});
