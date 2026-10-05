// Ported verbatim from the web app's src/utils/roles.js.
import type { User } from "../context/AuthContext";

export function isAdminTier(role?: string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (isAdminTier(user.role)) return true;
  return (user.permissions ?? []).includes(permission);
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super-Admin",
  ADMIN: "Admin",
  LEADER: "Umuyobozi",
  STUDENT: "Umunyeshuri",
};
