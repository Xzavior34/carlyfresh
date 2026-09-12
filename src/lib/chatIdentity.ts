/**
 * Centralized chat identity helpers.
 * Import these everywhere names / role labels are rendered in messaging UI.
 */

export type ChatRole = "admin" | "seller" | "driver" | "buyer";

/** Canonical display name for a user.
 *  Admin accounts always surface as "CarlyFresh · Admin". */
export function displayName(
  profile: { full_name?: string | null; business_name?: string | null } | null | undefined,
  role: string
): string {
  if (role === "admin") return "CarlyFresh · Admin";
  return profile?.business_name || profile?.full_name || "Unknown User";
}

/** Short role label shown in badges. */
export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: "Admin",
    seller: "Vendor",
    driver: "Driver",
    buyer: "Buyer",
  };
  return map[role] ?? role;
}

/** Tailwind colour classes for role badges. */
export const roleBadgeClass: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  seller: "bg-amber-100 text-amber-700",
  driver: "bg-blue-100 text-blue-700",
  buyer: "bg-emerald-100 text-emerald-700",
};

/** Format a UTC ISO timestamp for display in messages. */
export function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
