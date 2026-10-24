"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  PERMISSION_MATRIX,
  Role,
  TeamMember,
  hasPermission,
  isOwner,
  memberEmail,
  memberName,
  relativeTime,
  roleLabel,
} from "@/lib/team";
import { initials } from "@/lib/kyb";
import { cn } from "@/lib/utils";

/** Figma 44:264 — Member-Detail-Permissions. */
export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { business, loading: shellLoading } = useDashboard();

  const [member, setMember] = useState<TeamMember | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!business) {
      if (!shellLoading) setLoading(false);
      return;
    }
    const [biz, roleList] = await Promise.allSettled([
      businessApi.getBusiness(business.id),
      businessApi.listRoles(business.id),
    ]);
    if (biz.status === "fulfilled") {
      const detail = biz.value.data as { members?: TeamMember[] };
      const found = detail?.members?.find((m) => m.id === id) ?? null;
      setMember(found);
      setRoleId(found?.roleId ?? "");
    }
    if (roleList.status === "fulfilled") {
      const list = roleList.value.data as Role[] | undefined;
      setRoles(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  }, [business, shellLoading, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!business || !member) return;
    setSaving(true);
    setError(null);
    try {
      await businessApi.updateMember(business.id, member.id, roleId);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update this member.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!business || !member) return;
    setError(null);
    try {
      await businessApi.removeMember(business.id, member.id);
      router.push("/team");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not remove this member.");
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Team member" />
        <p className="p-8 text-[15px] text-slate-500">Loading…</p>
      </>
    );
  }

  if (!member) {
    return (
      <>
        <PageHeader title="Team member" />
        <p className="p-8 text-[15px] text-slate-500">This member could not be found.</p>
      </>
    );
  }

  // Permissions come from the role; the grid reflects what the role grants.
  const permissions = roles.find((r) => r.id === roleId)?.permissions ?? member.role?.permissions;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
        <nav className="flex items-center gap-2 text-[17px]">
          <Link href="/team" className="text-slate-500 hover:underline">
            Team Members
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-[#0F172A]">{memberName(member)}</span>
        </nav>
        {!isOwner(member) && member.isActive && (
          <button
            type="button"
            onClick={remove}
            className="rounded-lg border border-[#DC2626] px-4 py-2 text-[14px] font-semibold text-[#DC2626] transition-colors hover:bg-red-50"
          >
            Remove Member
          </button>
        )}
      </div>

      <div className="grid flex-1 gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_1.2fr] lg:p-8">
        <section className="h-fit rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF6FF] text-[16px] font-bold text-[#2563EB]">
              {initials(memberName(member))}
            </span>
            <span>
              <span className="block text-[20px] font-bold tracking-tight text-[#0F172A]">{memberName(member)}</span>
              <span className="block text-[14px] text-slate-500">{memberEmail(member)}</span>
            </span>
          </div>

          <hr className="my-5 border-slate-200" />

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Role</span>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={isOwner(member)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-[15px] text-slate-900 focus:border-[#2563EB] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            >
              {roles.length === 0 && <option value={member.roleId}>{roleLabel(member.role?.name)}</option>}
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {roleLabel(r.name)}
                </option>
              ))}
            </select>
            {isOwner(member) && (
              <span className="mt-1 block text-[13px] text-slate-500">The business owner&apos;s role is fixed.</span>
            )}
          </label>

          <dl className="mt-5 space-y-3 text-[15px]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <span
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-semibold",
                    member.isActive ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {member.isActive ? "Active" : "Removed"}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Joined</dt>
              <dd className="font-semibold text-[#0F172A]">
                {new Date(member.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Member for</dt>
              <dd className="font-semibold text-[#0F172A]">{relativeTime(member.createdAt)}</dd>
            </div>
          </dl>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <Button
            variant="brand"
            size="lg"
            className="mt-5 w-full"
            onClick={save}
            loading={saving}
            disabled={isOwner(member) || roleId === member.roleId}
          >
            {saved ? "Saved" : "Save Changes"}
          </Button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-[17px] font-bold text-[#0F172A]">Granular Permissions</h2>
          <p className="mt-1 text-[14px] text-slate-500">
            What the selected role grants. Permissions follow the role — per-member overrides are not supported by the
            API yet.
          </p>

          <ul className="mt-5 space-y-3">
            {PERMISSION_MATRIX.map((row) => (
              <li key={row.label} className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[15px] font-semibold text-[#0F172A]">{row.label}</span>
                <span className="flex flex-wrap gap-2">
                  {row.actions.map((action) => {
                    const granted = hasPermission(permissions, row.resource, action.action);
                    return (
                      <span
                        key={action.label}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[12px] font-semibold",
                          granted ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {action.label} {granted ? "✓" : "✕"}
                      </span>
                    );
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
