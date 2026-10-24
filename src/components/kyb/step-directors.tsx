"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircleIcon, CheckIcon, InfoIcon, PlusIcon, WarningIcon } from "./icons";
import { Director, initials, totalOwnership } from "@/lib/kyb";
import { cn } from "@/lib/utils";

type Props = {
  directors: Director[];
  onSave: (director: Director) => void;
  onRemove: (id: string) => void;
  /** Signed-in user's name, used to prefill the sole-owner shortcut. */
  accountName?: string;
};

type DraftPerson = { id: string; name: string; role: string; ownership: string };

export function StepDirectors({ directors, onSave, onRemove, accountName }: Props) {
  // The Figma has no add/edit frame for this step, so the editor below follows
  // the same form language as the Business Details step.
  const [editing, setEditing] = useState<DraftPerson | null>(null);
  const allocated = totalOwnership(directors);
  const overAllocated = allocated > 100;

  function startAdd() {
    setEditing({ id: crypto.randomUUID(), name: "", role: "", ownership: "" });
  }

  /** One director owning the whole company - the common single-founder case. */
  function startSoleOwner() {
    setEditing({
      id: crypto.randomUUID(),
      name: accountName?.trim() ?? "",
      role: "Director & Owner",
      ownership: "100",
    });
  }

  function startEdit(d: Director) {
    setEditing({ id: d.id, name: d.name, role: d.role, ownership: String(d.ownership) });
  }

  // Everything already allocated to *other* people, so the editor can tell you
  // how much is left and stop you going past 100% before you save.
  const allocatedExcludingEditing = totalOwnership(directors.filter((d) => d.id !== editing?.id));
  const editingOwnership = Number(editing?.ownership);
  const editorOwnershipError =
    editing && editing.ownership !== "" && Number.isFinite(editingOwnership)
      ? editingOwnership <= 0
        ? "Ownership must be greater than 0%."
        : allocatedExcludingEditing + editingOwnership > 100
          ? `That takes total ownership to ${allocatedExcludingEditing + editingOwnership}%. Only ${100 - allocatedExcludingEditing}% is left.`
          : null
      : null;

  function commit() {
    if (!editing || editorOwnershipError) return;
    const ownership = Number(editing.ownership);
    if (!editing.name.trim() || !editing.role.trim() || !Number.isFinite(ownership)) return;
    const existing = directors.find((d) => d.id === editing.id);
    onSave({
      id: editing.id,
      name: editing.name.trim(),
      role: editing.role.trim(),
      ownership,
      idStatus: existing?.idStatus ?? "PENDING",
    });
    setEditing(null);
  }

  return (
    <>
      <h1 className="text-[22px] font-bold tracking-tight text-[#0F172A] sm:text-[26px]">Directors &amp; Beneficial Owners</h1>
      <p className="mt-1.5 text-[15px] text-slate-600">
        Add all directors and any individual holding 25% or more of the company shares.
      </p>

      <hr className="my-6 border-slate-200" />

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-[#F8FAFC]">
            <tr className="text-[13px] font-semibold text-slate-600">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Ownership</th>
              <th className="px-5 py-3">ID Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {directors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[15px] text-slate-500">
                  No directors or beneficial owners added yet. A company with a single owner only needs one entry.
                </td>
              </tr>
            ) : (
              directors.map((d) => (
                <tr key={d.id} className="border-t border-slate-200">
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[11px] font-semibold text-[#2563EB]">
                        {initials(d.name)}
                      </span>
                      <span className="whitespace-nowrap text-[15px] font-semibold text-[#0F172A]">{d.name}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[15px] text-slate-600">{d.role}</td>
                  <td className="px-5 py-4 text-[15px] font-semibold text-[#0F172A]">{d.ownership}%</td>
                  <td className="px-5 py-4">
                    {d.idStatus === "VERIFIED" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[12px] font-semibold text-[#15803D]">
                        <CheckIcon className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[12px] font-semibold text-[#B45309]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#B45309]" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(d)}
                      className="text-[15px] font-semibold text-[#2563EB] hover:underline"
                    >
                      Edit
                    </button>
                    <span className="px-2 text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => onRemove(d.id)}
                      className="text-[15px] text-slate-400 hover:text-[#DC2626] hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#2563EB] bg-white px-6 text-[15px] font-semibold text-[#2563EB] transition-colors hover:bg-[#EFF6FF]"
          >
            <PlusIcon className="h-4 w-4" />
            Add Another Person
          </button>
          {directors.length === 0 && (
            <button
              type="button"
              onClick={startSoleOwner}
              className="inline-flex h-11 items-center rounded-lg px-4 text-[15px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              I&apos;m the sole owner
            </button>
          )}
        </div>

        <span
          className={cn(
            "flex items-center gap-2 text-[15px] font-semibold",
            allocated === 100 ? "text-[#16A34A]" : overAllocated ? "text-[#DC2626]" : "text-[#B45309]"
          )}
        >
          {allocated === 100 ? (
            <CheckCircleIcon className="h-5 w-5 text-[#16A34A]" />
          ) : (
            <WarningIcon className="h-5 w-5" />
          )}
          {allocated}% allocated
        </span>
      </div>

      {directors.length > 0 && allocated !== 100 && (
        <div
          className={cn(
            "mt-4 flex items-start gap-3 rounded-lg border px-5 py-4",
            overAllocated ? "border-[#FCA5A5] bg-red-50" : "border-[#F59E0B] bg-[#FEF3C7]"
          )}
        >
          <WarningIcon className={cn("mt-0.5 h-4 w-4 shrink-0", overAllocated ? "text-[#DC2626]" : "text-[#B45309]")} />
          <div className={cn("text-[14px]", overAllocated ? "text-[#B91C1C]" : "text-[#B45309]")}>
            <p className="font-semibold">
              {overAllocated
                ? `Ownership adds up to ${allocated}% — that is ${allocated - 100}% too much`
                : `Ownership adds up to ${allocated}% — ${100 - allocated}% is unaccounted for`}
            </p>
            <p>
              {overAllocated
                ? "Reduce one or more shareholdings so the total is exactly 100%."
                : "Add the remaining shareholders, or raise an existing holding so the total is exactly 100%."}
            </p>
          </div>
        </div>
      )}

      {editing && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5">
          <h3 className="text-[15px] font-semibold text-[#0F172A]">
            {directors.some((d) => d.id === editing.id) ? "Edit person" : "Add a person"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Input
              label="Full Name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Chinedu Okafor"
            />
            <Input
              label="Role"
              value={editing.role}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              placeholder="Director & CEO"
            />
            <Input
              label="Ownership (%)"
              inputMode="numeric"
              value={editing.ownership}
              onChange={(e) => setEditing({ ...editing, ownership: e.target.value.replace(/[^\d.]/g, "") })}
              placeholder="60"
              error={editorOwnershipError ?? undefined}
              hint={editorOwnershipError ? undefined : `${Math.max(0, 100 - allocatedExcludingEditing)}% still unallocated`}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button type="button" variant="brand" onClick={commit} disabled={!!editorOwnershipError}>
              Save person
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <hr className="my-6 border-slate-200" />

      <p className="flex items-start gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] px-5 py-4 text-[14px] leading-relaxed text-slate-600">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <span>
          <span className="font-semibold text-[#0F172A]">Important note:</span> All persons with 25% or more direct or
          indirect ownership of the entity must be added for statutory compliance checks.
        </span>
      </p>
    </>
  );
}
