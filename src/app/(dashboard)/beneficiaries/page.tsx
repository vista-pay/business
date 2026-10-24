"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { businessApi } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Modal } from "@/components/dashboard/modal";
import { PlusIcon } from "@/components/kyb/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Beneficiary, beneficiaryRail, maskAccount } from "@/lib/transfers";
import { initials } from "@/lib/kyb";
import { cn } from "@/lib/utils";

const RAILS = ["All", "Bank", "Rendi", "International"] as const;
const PAGE_SIZE = 10;

export default function BeneficiariesPage() {
  const [items, setItems] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [rail, setRail] = useState<(typeof RAILS)[number]>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await businessApi.listBeneficiaries();
      const list = res.data as Beneficiary[] | undefined;
      setItems(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load saved contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((b) => {
      if (rail !== "All" && beneficiaryRail(b) !== rail) return false;
      if (!needle) return true;
      return (
        b.displayName.toLowerCase().includes(needle) ||
        (b.bankName ?? "").toLowerCase().includes(needle) ||
        (b.vistaTag ?? "").toLowerCase().includes(needle) ||
        (b.accountNumber ?? "").includes(needle)
      );
    });
  }, [items, rail, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function remove(id: string) {
    setItems((prev) => prev.filter((b) => b.id !== id));
    try {
      await businessApi.deleteBeneficiary(id);
    } catch {
      load();
    }
  }

  return (
    <>
      <PageHeader
        title="Beneficiaries"
        description="Manage your saved corporate contacts, bank details, and cross-border settlement routes"
        action={
          <Button variant="brand" size="lg" onClick={() => setAdding(true)} className="shrink-0">
            <PlusIcon className="h-4 w-4" />
            Add Beneficiary
          </Button>
        }
      />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {RAILS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setRail(option);
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
                  option === rail ? "bg-[#EFF6FF] text-[#2563EB]" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="relative min-w-0 flex-1 sm:max-w-[280px]">
            <span className="sr-only">Search saved contacts</span>
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
              placeholder="Search saved contacts..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Bank/Tag</th>
                  <th className="px-6 py-4">Account/Details</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4">Last Used</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <Empty>Loading saved contacts…</Empty>
                ) : rows.length === 0 ? (
                  <Empty>
                    {rail === "International"
                      ? "No international contacts. Saved recipients are stored as Rendi or bank contacts today — the API has no international recipient type yet."
                      : items.length === 0
                        ? "No saved beneficiaries yet."
                        : "No contacts match this filter."}
                  </Empty>
                ) : (
                  rows.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100 text-[15px] last:border-0 hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[11px] font-semibold text-[#2563EB]">
                            {initials(b.displayName)}
                          </span>
                          <span className="whitespace-nowrap font-semibold text-[#0F172A]">{b.displayName}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{beneficiaryRail(b)}</td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#0F172A]">
                        {b.type === "VISTA" ? (b.vistaTag ?? b.identifier) : (b.bankName ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {b.type === "VISTA" ? "—" : maskAccount(b.accountNumber)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">—</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {b.updatedAt ? new Date(b.updatedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => remove(b.id)}
                          className="text-[15px] font-semibold text-[#DC2626] hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
            <p className="text-[14px] text-slate-500">
              {filtered.length === 0
                ? "Showing 0 of 0"
                : `Showing ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-2">
              <PageButton onClick={() => setPage(current - 1)} disabled={current <= 1} label="Previous page">
                ‹
              </PageButton>
              <span className="text-[14px] font-semibold text-[#0F172A]">
                Page {current} of {pageCount}
              </span>
              <PageButton onClick={() => setPage(current + 1)} disabled={current >= pageCount} label="Next page">
                ›
              </PageButton>
            </div>
          </div>
        </div>
      </div>

      {adding && (
        <AddBeneficiaryModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
    </>
  );
}

function AddBeneficiaryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"BANK" | "VISTA">("BANK");
  const [displayName, setDisplayName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tag, setTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    displayName.trim() &&
    (type === "VISTA" ? tag.trim() : bankName.trim() && bankCode.trim() && accountNumber.trim().length === 10);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await businessApi.createBeneficiary(
        type === "VISTA"
          ? { type, displayName: displayName.trim(), identifier: tag.trim(), vistaTag: tag.trim() }
          : {
              type,
              displayName: displayName.trim(),
              identifier: `${bankCode.trim()}:${accountNumber.trim()}`,
              bankCode: bankCode.trim(),
              bankName: bankName.trim(),
              accountNumber: accountNumber.trim(),
            }
      );
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save this beneficiary.");
      setSaving(false);
    }
  }

  return (
    <Modal title="Add Beneficiary" onClose={onClose} width="max-w-[560px]">
      <div className="flex gap-6 border-b border-slate-200">
        {(["BANK", "VISTA"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-[15px] font-semibold transition-colors",
              type === option ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {option === "BANK" ? "Bank account" : "Rendi tag"}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <Input label="Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Oluwaseun Adeyemi" />
        {type === "VISTA" ? (
          <Input label="Rendi tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="@amina.rendi" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="GTBank" />
              <Input label="Bank code" value={bankCode} onChange={(e) => setBankCode(e.target.value.replace(/\D/g, ""))} placeholder="058" />
            </div>
            <Input
              label="Account number"
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="0123456789"
              hint="10-digit NUBAN"
            />
          </>
        )}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <button type="button" onClick={onClose} className="text-[15px] text-[#0F172A] hover:underline">
          Cancel
        </button>
        <Button variant="brand" size="lg" onClick={save} loading={saving} disabled={!valid}>
          Save beneficiary
        </Button>
      </div>
    </Modal>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={7} className="px-6 py-12 text-center text-[15px] text-slate-500">
        {children}
      </td>
    </tr>
  );
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
