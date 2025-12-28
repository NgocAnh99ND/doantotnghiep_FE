import React from "react";
import type { User } from "../types/models";
import { session } from "../services/session.service";
import { authApi } from "../api/auth/auth.api";

type AuthState =
  | { status: "loading"; user: null; lastPhone: string | null }
  | { status: "guest"; user: null; lastPhone: string | null }
  | { status: "authed"; user: User; lastPhone: string | null };

type AuthActions = {
  hydrate: () => Promise<void>;
  login: (phone: string, password: string) => Promise<User>;
  registerAndLogin: (body: { user_name: string; phone: string; password: string; role: "DRIVER" | "PASSENGER" }) => Promise<User>;
  logout: () => Promise<void>;
  clearRememberedPhone: () => Promise<void>;
};

const Ctx = React.createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = React.useState<AuthState>({ status: "loading", user: null, lastPhone: null });

  const hydrate = React.useCallback(async () => {
    const [user, lastPhone] = await Promise.all([session.getUser(), session.getLastPhone()]);
    if (user) setState({ status: "authed", user, lastPhone: lastPhone ?? user.phone ?? null });
    else setState({ status: "guest", user: null, lastPhone });
  }, []);

  React.useEffect(() => { hydrate(); }, [hydrate]);

  const login = React.useCallback(async (phone: string, password: string) => {
    const user = await authApi.login({ phone, password });
    await Promise.all([session.setUser(user), session.setLastPhone(phone)]);
    setState({ status: "authed", user, lastPhone: phone });
    return user;
  }, []);

  const registerAndLogin = React.useCallback(async (body: { user_name: string; phone: string; password: string; role: "DRIVER" | "PASSENGER" }) => {
    const user = await authApi.register(body);
    await Promise.all([session.setUser(user), session.setLastPhone(body.phone)]);
    setState({ status: "authed", user, lastPhone: body.phone });
    return user;
  }, []);

  const logout = React.useCallback(async () => {
    try {
      if (state.status === "authed") await authApi.logout(state.user.user_id);
    } catch {}
    await session.clearUser();
    setState({ status: "guest", user: null, lastPhone: state.lastPhone });
  }, [state]);

  const clearRememberedPhone = React.useCallback(async () => {
    await session.clearLastPhone();
    if (state.status === "authed") setState({ ...state, lastPhone: null });
    else setState({ status: "guest", user: null, lastPhone: null });
  }, [state]);

  return (
    <Ctx.Provider value={{ ...(state as any), hydrate, login, registerAndLogin, logout, clearRememberedPhone }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
