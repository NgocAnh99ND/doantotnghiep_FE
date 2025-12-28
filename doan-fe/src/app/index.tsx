import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../store/authStore";
import { Loading } from "../components";
import { homeByRole } from "../services/guards";

export default function Index() {
  const { status, user, lastPhone } = useAuth();

  if (status === "loading") return <Loading />;

  if (status === "guest") {
    return <Redirect href={lastPhone ? "/(auth)/login" : "/(auth)/register"} />;
  }

  return <Redirect href={homeByRole(user.role)} />;
}
