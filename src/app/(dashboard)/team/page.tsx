"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Modal } from "@/components/dashboard/modal";
import { PlusIcon } from "@/components/kyb/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Role, TeamMember, isOwner, memberEmail, memberName, relativeTime, roleLabel, rolePreview } from "@/lib/team";
import { initials } from "@/lib/kyb";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 7;

/** Figma 44:9 — Team-Members-List. */
export default function TeamPage() {
  const { business, loading: shellLoading } = useDashboard();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [inviting, setInviting] = useState(false);
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
      setMembers(detail?.members ?? []);
    }
    if (roleList.status === "fulfilled") {
      const list = roleList.value.data as Role[] | undefined;
      setRoles(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  }, [business, shellLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return members;
    return members.filter(
      (m) => memberName(m).toLowerCase().includes(needle) || memberEmail(m).toLowerCase().includes(needle)
    );
  }, [members, search]);

  const active = members.filter((m) => m.isActive).length;
  const inactive = members.length - active;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function remove(member: TeamMember) {
    if (!business) return;
    setError(null);
    try {
      await businessApi.removeMember(business.id, member.id);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not remove this member.");
    }
  }

  return (
    <>
      <PageHeader
        title="Team Members"
        description="Manage permissions and invite collaborators to your business."
        action={
          <Button variant="brand" size="lg" onClick={() => setInviting(true)} disabled={!business} className="shrink-0">
            <PlusIcon className="h-4 w-4" />
            Invite Member
          </Button>
        }
      />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Members" value={members.length} />
          <StatCard label="Active" value={active} badge="Active" badgeTone="bg-[#DCFCE7] text-[#15803D]" />
          <StatCard label="Inactive" value={inactive} badge="Removed" badgeTone="bg-slate-100 text-slate-600" />
        </section>

        <label className="relative block">
          <span className="sr-only">Search members</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search members by name or email..."
            className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </label>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[840px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <Empty>Loading team…</Empty>
              ) : !business ? (
                <Empty>Create your business first — team members are invited to a company.</Empty>
              ) : rows.length === 0 ? (
                <Empty>{members.length === 0 ? "No team members yet." : "No members match that search."}</Empty>
              ) : (
                rows.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 text-[15px] last:border-0 hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4">
                      <Link href={`/team/${member.id}`} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[11px] font-semibold text-[#2563EB]">
                          {initials(memberName(member))}
                        </span>
                        <span className="whitespace-nowrap font-semibold text-[#0F172A] hover:underline">
                          {memberName(member)}
                        </span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{memberEmail(member)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{roleLabel(member.role?.name)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[12px] font-semibold",
                          member.isActive ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {member.isActive ? "Active" : "Removed"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{relativeTime(member.createdAt)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link href={`/team/${member.id}`} className="text-[15px] font-semibold text-[#2563EB] hover:underline">
                        Manage
                      </Link>
                      {!isOwner(member) && member.isActive && (
                        <>
                          <span className="px-2 text-slate-300">·</span>
                          <button
                            type="button"
                            onClick={() => remove(member)}
                            className="text-[15px] text-slate-400 hover:text-[#DC2626] hover:underline"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-slate-500">
            {filtered.length === 0
              ? "Showing 0 members"
              : `Showing ${(current - 1) * PAGE_SIZE + 1}-${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length} members`}
          </p>
          <div className="flex items-center gap-2">
            <Pager onClick={() => setPage(current - 1)} disabled={current <= 1}>
              Previous
            </Pager>
            <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#2563EB] px-3 text-[14px] font-semibold text-white">
              {current}
            </span>
            <Pager onClick={() => setPage(current + 1)} disabled={current >= pageCount}>
              Next
            </Pager>
          </div>
        </div>
      </div>

      {inviting && business && (
        <InviteMemberModal
          businessId={business.id}
          roles={roles}
          onClose={() => setInviting(false)}
          onInvited={() => {
            setInviting(false);
            load();
          }}
        />
      )}
    </>
  );
}

/** Figma 44:175 — Invite-Member-Modal. */
function InviteMemberModal({
  businessId,
  roles,
  onClose,
  onInvited,
}: {
  businessId: string;
  roles: Role[];
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = roles.find((r) => r.id === roleId);
  const preview = rolePreview(role);

  async function invite() {
    setSaving(true);
    setError(null);
    try {
      await businessApi.inviteMember(businessId, { email: email.trim(), roleId });
      onInvited();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send this invitation.");
      setSaving(false);
    }
  }

  return (
    <Modal title="Invite Team Member" onClose={onClose} width="max-w-[560px]">
      <div className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
          hint="They must already have a Rendi account — invitations attach to an existing user."
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Role</span>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="h-11 w-full rounded-lg border border-[#2563EB] bg-white px-3 text-[15px] text-slate-900 focus:outline-none"
          >
            {roles.length === 0 && <option value="">No roles available</option>}
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {roleLabel(r.name)}
              </option>
            ))}
          </select>
        </label>

        {role && (
          <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-[#2563EB]">
              Permissions preview — {roleLabel(role.name)}
            </p>
            <ul className="mt-3 space-y-2">
              {preview.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-[15px]">
                  <span className={item.granted ? "text-[#16A34A]" : "text-[#DC2626]"} aria-hidden="true">
                    {item.granted ? "✓" : "⊗"}
                  </span>
                  <span className={item.granted ? "text-[#0F172A]" : "text-slate-500"}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Personal Message (Optional)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Enter a brief introductory message..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
          />
          <span className="mt-1 block text-[13px] text-slate-500">
            Not delivered yet — the API attaches the member without sending a note.
          </span>
        </label>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </div>

      <div className="mt-7 flex items-center justify-end gap-4">
        <button type="button" onClick={onClose} className="text-[15px] font-semibold text-[#0F172A] hover:underline">
          Cancel
        </button>
        <Button variant="brand" size="lg" onClick={invite} loading={saving} disabled={!email.trim() || !roleId}>
          Send Invitation
        </Button>
      </div>
    </Modal>
  );
}

function StatCard({
  label,
  value,
  badge,
  badgeTone,
}: {
  label: string;
  value: number;
  badge?: string;
  badgeTone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[14px] text-slate-500">{label}</p>
      <p className="mt-2 flex items-center gap-3">
        <span className="text-[26px] font-bold tracking-tight text-[#0F172A]">{value}</span>
        {badge && <span className={cn("rounded-md px-2 py-1 text-[12px] font-semibold", badgeTone)}>{badge}</span>}
      </p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={6} className="px-6 py-12 text-center text-[15px] text-slate-500">
        {children}
      </td>
    </tr>
  );
}

function Pager({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[14px] font-semibold text-[#0F172A] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
    >
      {children}
    </button>
  );
}
