// Central chat identity formatting — one source of truth for sender names,
// role tags, and message timestamps across every chat surface (customer
// Messages, Admin Support Inbox, order MiniChat, push notifications).

export type ChatIdentity = {
  user_id?: string | null;
  business_name?: string | null;
  full_name?: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  seller: "Vendor",
  driver: "Driver",
  buyer: "Buyer",
};

const ROLE_TAG_CLASSES: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  seller: "bg-amber-100 text-amber-700",
  driver: "bg-blue-100 text-blue-700",
  buyer: "bg-emerald-100 text-emerald-700",
};

const FALLBACK_NAME = "CarlyFresh User";
// Stored names we never surface (placeholder/system values, or the admin
// account's raw profile name — admins always render as "CarlyFresh").
const RESERVED_NAMES = /^(supabase|carlyfresh(\s*admin)?)$/i;

export function getRoleLabel(role?: string | null): string {
  return ROLE_LABELS[role ?? "buyer"] ?? "Member";
}

export function getRoleTagClasses(role?: string | null): string {
  return ROLE_TAG_CLASSES[role ?? "buyer"] ?? "bg-muted text-muted-foreground";
}

/** Display name for a chat participant. Admins always show as CarlyFresh. */
export function getChatDisplayName(
  profile?: ChatIdentity | null,
  role?: string | null
): string {
  if (role === "admin") return "CarlyFresh";
  const name =
    (profile?.business_name ?? "").trim() || (profile?.full_name ?? "").trim();
  if (!name || RESERVED_NAMES.test(name)) return FALLBACK_NAME;
  return name;
}

/** Push-notification heading for a sender. Admins send as CarlyFresh Admin. */
export function getPushHeadingForRole(role?: string | null): string {
  return role === "admin" ? "CarlyFresh Admin" : "New Message";
}

/** Compact timestamp: "14:32" today, "Sep 12 · 14:32" otherwise. */
export function formatMessageTime(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return time;
  const day = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${day} · ${time}`;
}
