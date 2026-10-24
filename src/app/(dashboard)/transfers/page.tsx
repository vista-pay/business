"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { NewTransferModal } from "@/components/dashboard/new-transfer-modal";
import { PlusIcon } from "@/components/kyb/icons";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Transaction, counterparty, money } from "@/lib/dashboard-data";
import {
  TRANSFER_RAILS,
  TRANSFER_STATUSES,
  TransferRail,
  TransferStatus,
  filterTransfers,
  railOf,
} from "@/lib/transfers";
import { TIME_FILTERS, TimeFilter, filterPayments } from "@/lib/payments";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function TransfersPage() {
  const { business, loading: shellLoading } = useDashboard();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; currencyCode: string; availableBalance: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [search, setSearch] = useState("");
  const [time, setTime] = useState<TimeFilter>("All Time");
  const [status, setStatus] = useState<TransferStatus>("Status: All");
  const [rail, setRail] = useState<TransferRail>("All");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!business) {
      if (!shellLoading) setLoading(false);
      return;
    }
    const [tx, biz] = await Promise.allSettled([
      businessApi.listTransactions({ limit: 500, businessId: business.id }),
      businessApi.getBusiness(business.id),
    ]);
    if (tx.status === "fulfilled") {
      const items = (tx.value.data as { items?: Transaction[] })?.items;
      setTransactions(Array.isArray(items) ? items : []);
    }
    if (biz.status === "fulfilled") {
      const detail = biz.value.data as { wallet?: { accounts?: typeof accounts } };
      setAccounts(detail?.wallet?.accounts ?? []);
    }
    setLoading(false);
  }, [business, shellLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    // Time filtering is shared with Payments; the rest is transfer-specific.
    const byTime = filterPayments(transactions, { search: "", status: "All", currency: "All", time });
    return filterTransfers(byTime, { search, rail, status }, counterparty);
  }, [transactions, search, rail, status, time]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Transfers"
        description="Initiate and review bulk payouts, local and international wire transfers"
        action={
          <Button
            variant="brand"
            size="lg"
            onClick={() => setCreating(true)}
            disabled={!business || accounts.length === 0}
            className="shrink-0"
          >
            <PlusIcon className="h-4 w-4" />
            New Transfer
          </Button>
        }
      />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 sm:max-w-[280px]">
            <span className="sr-only">Search transfers</span>
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
              placeholder="Search transfers..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </label>

          <FilterSelect
            options={TIME_FILTERS}
            value={time}
            onChange={(e) => {
              setTime(e.target.value as TimeFilter);
              setPage(1);
            }}
            aria-label="Filter by time"
          />
          <FilterSelect
            options={TRANSFER_STATUSES}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as TransferStatus);
              setPage(1);
            }}
            aria-label="Filter by status"
          />

          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {TRANSFER_RAILS.map((option) => (
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
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Currency</th>
                  <th className="px-6 py-4 text-right">Fee</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <Empty>Loading transfers…</Empty>
                ) : !business ? (
                  <Empty>Create your business first — payouts are made from the company wallet.</Empty>
                ) : rows.length === 0 ? (
                  <Empty>{transactions.length === 0 ? "No transfers yet." : "No transfers match these filters."}</Empty>
                ) : (
                  rows.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 text-[15px] last:border-0 hover:bg-[#F8FAFC]">
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{shortDateTime(t.createdAt)}</td>
                      <td className="px-6 py-4 font-semibold text-[#0F172A]">{counterparty(t)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{railOf(t)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-[#0F172A]">
                        {money(t.amount, t.currency)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{t.currency}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-slate-600">
                        {money(t.fee ?? "0", t.currency)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StatusBadge status={t.status} />
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

      {creating && business && (
        <NewTransferModal
          businessId={business.id}
          accounts={accounts}
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </>
  );
}

function shortDateTime(value: string) {
  return new Date(value)
    .toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
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
