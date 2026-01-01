import { postJson } from "../../libs/http";
import type { LoginResponse, RegisterResponse, LogoutResponse, User } from "../../types/models";

function ensureSuccess<T extends { success: boolean; message?: string; mess?: string; error?: string }>(res: T): T {
  if (!res.success) throw new Error(res.message ?? res.mess ?? res.error ?? "Thao tác thất bại");
  return res;
}

function attachPassengerId(user: User, passenger_id?: number | null): User {
  if (user.role === "PASSENGER") {
    return { ...user, passenger_id: passenger_id ?? null };
  }
  return user;
}

export const authApi = {
  async login(body: { phone: string; password: string }): Promise<User> {
    const res = ensureSuccess(await postJson<LoginResponse>("/api/auth/login", body));
    if (!res.user) throw new Error("Thiếu dữ liệu user");
    return attachPassengerId(res.user, res.passenger_id);
  },

  async register(body: { user_name: string; phone: string; password: string; role: "DRIVER" | "PASSENGER" }): Promise<User> {
    const res = ensureSuccess(await postJson<RegisterResponse>("/api/auth/register", body));
    if (!res.user) throw new Error("Thiếu dữ liệu user");
    return attachPassengerId(res.user, res.passenger_id);
  },

  async logout(user_id?: number): Promise<void> {
    await postJson<LogoutResponse>("/api/auth/logout", { user_id: user_id ?? null });
  },
};
