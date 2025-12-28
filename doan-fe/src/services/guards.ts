import type { UserRole } from "../types/models";

export function homeByRole(role: UserRole) {
  if (role === "ADMIN") return "/admin/users";
  return "/(tabs)/home";
}
