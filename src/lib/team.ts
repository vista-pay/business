// Team members (Figma 44:9 / 44:175 / 44:264).

export type Permission = { resource: string; action: string };

export type Role = { id: string; name: string; description?: string | null; permissions: Permission[] };

export type TeamMember = {
  id: string;
  userId: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
  user?: { email?: string; profile?: { firstName?: string; lastName?: string } | null };
  role?: { id: string; name: string; permissions?: Permission[] };
};

export function memberName(member: TeamMember) {
  const name = [member.user?.profile?.firstName, member.user?.profile?.lastName].filter(Boolean).join(" ");
  return name || member.user?.email || "Unknown member";
}

export function memberEmail(member: TeamMember) {
  return member.user?.email ?? "—";
}

/** `BUSINESS_OWNER` → `Business Owner`. */
export function roleLabel(name?: string | null) {
  if (!name) return "Member";
  return name
    .toLowerCase()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function isOwner(member: TeamMember) {
  return member.role?.name === "BUSINESS_OWNER";
}

/** The permission grid on the member screen, in the design's order. */
export const PERMISSION_MATRIX: Array<{ label: string; resource: string; actions: Array<{ label: string; action: string }> }> = [
  { label: "Wallets", resource: "wallet", actions: [{ label: "View", action: "read" }, { label: "Create", action: "write" }, { label: "Manage", action: "*" }] },
  { label: "Payments", resource: "payments", actions: [{ label: "View", action: "read" }, { label: "Create", action: "write" }, { label: "Approve", action: "*" }] },
  { label: "Transfers", resource: "payments", actions: [{ label: "View", action: "read" }, { label: "Initiate", action: "write" }, { label: "Approve", action: "*" }] },
  { label: "Beneficiaries", resource: "payments", actions: [{ label: "View", action: "read" }, { label: "Create", action: "write" }, { label: "Delete", action: "*" }] },
  { label: "Reports", resource: "reports", actions: [{ label: "View", action: "read" }, { label: "Export", action: "write" }] },
  { label: "Team", resource: "members", actions: [{ label: "View", action: "read" }, { label: "Manage", action: "write" }] },
  { label: "Settings", resource: "members", actions: [{ label: "View", action: "read" }, { label: "Manage", action: "*" }] },
  { label: "API", resource: "api_keys", actions: [{ label: "View", action: "read" }, { label: "Manage", action: "write" }] },
];

export function hasPermission(permissions: Permission[] | undefined, resource: string, action: string) {
  if (!permissions) return false;
  return permissions.some(
    (p) =>
      p.resource === resource &&
      (p.action === "*" || p.action === action || (action === "read" && p.action === "write"))
  );
}

/** Plain-language summary of a role, for the invite dialog's preview. */
export function rolePreview(role: Role | undefined) {
  if (!role) return [];
  const p = role.permissions;
  return [
    { label: "View all wallets and balances", granted: hasPermission(p, "wallet", "read") },
    { label: "Create and approve payments", granted: hasPermission(p, "payments", "write") },
    { label: "Manage beneficiaries", granted: hasPermission(p, "payments", "write") },
    { label: "View and export reports", granted: hasPermission(p, "reports", "read") },
    { label: "Manage team members", granted: hasPermission(p, "members", "write") },
    { label: "API & developer settings", granted: hasPermission(p, "api_keys", "write") },
    { label: "Business settings", granted: hasPermission(p, "members", "*") },
  ];
}

export function relativeTime(value?: string | null) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
