import { storage } from "./storage";
import type { User } from "../types/models";

const KEYS = {
  authUser: "rideshare_auth_user",
  lastPhone: "rideshare_last_phone",
} as const;

export const session = {
  async getUser(): Promise<User | null> {
    const s = await storage.getItem(KEYS.authUser);
    if (!s) return null;
    try { return JSON.parse(s) as User; } catch { return null; }
  },
  async setUser(user: User) {
    await storage.setItem(KEYS.authUser, JSON.stringify(user));
  },
  async clearUser() {
    await storage.removeItem(KEYS.authUser);
  },
  async getLastPhone() {
    return (await storage.getItem(KEYS.lastPhone)) ?? null;
  },
  async setLastPhone(phone: string) {
    await storage.setItem(KEYS.lastPhone, phone);
  },
  async clearLastPhone() {
    await storage.removeItem(KEYS.lastPhone);
  },
};
