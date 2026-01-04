// services/guards.ts
import type { UserRole } from "../types/models";

export function homeByRole(role: UserRole) {
  if (role === "ADMIN") return "/admin/users";
  if (role === "DRIVER") return "/(tabs)/matches";
  return "/(tabs)/home"; // PASSENGER
}
