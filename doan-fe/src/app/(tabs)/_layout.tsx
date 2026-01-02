import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/store/authStore";
import { Loading } from "@/components";

export default function TabsLayout() {
  const { status, user } = useAuth();

  if (status === "loading") return <Loading />;

  const role = status === "authed" ? user.role : "GUEST";
  const isDriver = role === "DRIVER";
  const isPassenger = role === "PASSENGER";

  // Tab mặc định sau khi vào (tabs)
  const initialRouteName = isDriver ? "matches" : "home";

  // Quyền hiển thị tab
  const canShow = {
    home: isPassenger,
    routes: isPassenger,
    requests: isDriver,
    matches: isDriver || isPassenger,
    profile: isDriver || isPassenger,
  } as const;

  return (
    <Tabs
      key={role} // đổi role => remount tabs
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="home"
        options={
          canShow.home
            ? {
                title: "Home",
                tabBarIcon: ({ size, color }) => <Ionicons name="home" size={size} color={color} />,
              }
            : { href: null }
        }
      />

      <Tabs.Screen
        name="routes"
        options={
          canShow.routes
            ? {
                title: "Routes",
                tabBarIcon: ({ size, color }) => <Ionicons name="map" size={size} color={color} />,
              }
            : { href: null }
        }
      />

      <Tabs.Screen
        name="requests"
        options={
          canShow.requests
            ? {
                title: "Requests",
                tabBarIcon: ({ size, color }) => <Ionicons name="clipboard" size={size} color={color} />,
              }
            : { href: null }
        }
      />

      <Tabs.Screen
        name="matches"
        options={
          canShow.matches
            ? {
                title: "Matches",
                tabBarIcon: ({ size, color }) => <Ionicons name="git-compare" size={size} color={color} />,
              }
            : { href: null }
        }
      />

      <Tabs.Screen
        name="profile"
        options={
          canShow.profile
            ? {
                title: "Profile",
                tabBarIcon: ({ size, color }) => <Ionicons name="person" size={size} color={color} />,
              }
            : { href: null }
        }
      />
    </Tabs>
  );
}