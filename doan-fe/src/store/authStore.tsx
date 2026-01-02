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
  registerAndLogin: (body: {
    user_name: string;
    phone: string;
    password: string;
    role: "DRIVER" | "PASSENGER";
  }) => Promise<User>;
  logout: (opts?: { clearRememberedPhone?: boolean }) => Promise<void>;
  clearRememberedPhone: () => Promise<void>;
};

const Ctx = React.createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = React.useState<AuthState>({
    status: "loading",
    user: null,
    lastPhone: null,
  });

  // =====================
  // HYDRATE
  // =====================
  const hydrate = React.useCallback(async () => {
    const [user, lastPhone] = await Promise.all([
      session.getUser(),
      session.getLastPhone(),
    ]);

    if (user) {
      setState({
        status: "authed",
        user,
        lastPhone: lastPhone ?? user.phone ?? null,
      });
    } else {
      setState({
        status: "guest",
        user: null,
        lastPhone,
      });
    }
  }, []);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  // =====================
  // LOGIN
  // =====================
  const login = React.useCallback(async (phone: string, password: string) => {
    const user = await authApi.login({ phone, password });
    await Promise.all([
      session.setUser(user),
      session.setLastPhone(phone),
    ]);

    setState({
      status: "authed",
      user,
      lastPhone: phone,
    });

    return user;
  }, []);

  // =====================
  // REGISTER + LOGIN
  // =====================
  const registerAndLogin = React.useCallback(
    async (body: {
      user_name: string;
      phone: string;
      password: string;
      role: "DRIVER" | "PASSENGER";
    }) => {
      const user = await authApi.register(body);
      await Promise.all([
        session.setUser(user),
        session.setLastPhone(body.phone),
      ]);

      setState({
        status: "authed",
        user,
        lastPhone: body.phone,
      });

      return user;
    },
    []
  );

  // =====================
  // LOGOUT (FIX CHÍNH Ở ĐÂY)
  // =====================
  const logout = React.useCallback(
    async (opts?: { clearRememberedPhone?: boolean }) => {
      console.log("[Auth] logout start");

      const currentUser =
        state.status === "authed" ? state.user : null;

      // 1️⃣ gọi BE logout (nếu có user)
      try {
        if (currentUser?.user_id != null) {
          await authApi.logout(currentUser.user_id);
        }
      } catch (e) {
        console.warn("[Auth] logout api failed", e);
        // ❗ không throw – vẫn logout local
      }

      // 2️⃣ clear local session
      await session.clearUser();

      if (opts?.clearRememberedPhone) {
        await session.clearLastPhone();
      }

      // 3️⃣ set state về guest (CUỐI CÙNG)
      setState({
        status: "guest",
        user: null,
        lastPhone: opts?.clearRememberedPhone
          ? null
          : state.lastPhone,
      });

      console.log("[Auth] logout done");
    },
    [state]
  );

  // =====================
  // CLEAR PHONE
  // =====================
  const clearRememberedPhone = React.useCallback(async () => {
    await session.clearLastPhone();
    setState((prev) =>
      prev.status === "authed"
        ? { ...prev, lastPhone: null }
        : { status: "guest", user: null, lastPhone: null }
    );
  }, []);

  return (
    <Ctx.Provider
      value={{
        ...(state as any),
        hydrate,
        login,
        registerAndLogin,
        logout,
        clearRememberedPhone,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// =====================
// useAuth
// =====================
export function useAuth() {
  const ctx = React.useContext(Ctx);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider />");
  }
  return ctx;
}
