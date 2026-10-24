"use client";
import { useEffect, useMemo, useState } from "react";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { PaymentDetailPanel } from "@/components/dashboard/payment-detail-panel";
import { Transaction, counterparty, isCredit, money, totalsByCurrency } from "@/lib/dashboard-data";
import {
  STATUS_FILTERS,
  StatusFilter,
  TIME_FILTERS,
  TimeFilter,
  currenciesIn,
  downloadCsv,
  filterPayments,
  methodLabel,
  toCsv,
} from "@/lib/payments";
import { FilterSelect } from "@/components/ui/filter-select";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
/** One fetch feeds search, filters, paging and the summary, so cap the pull. */
const FETCH_LIMIT = 500;

export default function PaymentsPage() {
  const { business, loading: shellLoading } = useDashboard();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [currency, setCurrency] = useState("All");
  const [time, setTime] = useState<TimeFilter>("All Time");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!business) {
        if (!shellLoading) setLoading(false);
        return;
      }
      try {
        const res = await businessApi.listTransactions({ limit: FETCH_LIMIT, businessId: business.id });
        if (cancelled) return;
        const items = (res.data as { items?: Transaction[] })?.items;
        setTransactions(Array.isArray(items) ? items : []);
      } catch {
        if (!cancelled) setTransactions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [business, shellLoading]);

  const filters = useMemo(() => ({ search, status, currency, time }), [search, status, currency, time]);
  const filtered = useMemo(() => filterPayments(transactions, filters), [transactions, filters]);
  const currencies = useMemo(() => currenciesIn(transactions), [transactions]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const received = totalsByCurrency(filtered.filter((t) => t.status === "SUCCESS" && isCredit(t.type)));

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <>
      <PageHeader
        title="Payments"
        description="Track and manage standard corporate pay-ins and invoices"
        action={
          <button
            type="button"
            onClick={() => downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(filtered))}
            disabled={filtered.length === 0}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[14px] font-semibold text-[#0F172A] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M12 4v10" />
              <path d="m8 11 4 4 4-4" />
              <path d="M5 19h14" />
            </svg>
            Export
          </button>
        }
      />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 sm:max-w-[280px]">
            <span className="sr-only">Search payments</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={search}
              onChange={(e) => resetPage(setSearch)(e.target.value)}
              placeholder="Search payments..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </label>

          <FilterSelect
            options={TIME_FILTERS}
            value={time}
            onChange={(e) => resetPage(setTime)(e.target.value as TimeFilter)}
            aria-label="Filter by time"
          />

          <SegmentedControl
            options={[...STATUS_FILTERS]}
            value={status}
            onChange={(v) => resetPage(setStatus)(v as StatusFilter)}
          />
          {currencies.length > 2 && (
            <SegmentedControl options={currencies} value={currency} onChange={resetPage(setCurrency)} />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Currency</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <EmptyRow>Loading payments…</EmptyRow>
                ) : !business ? (
                  <EmptyRow>
                    Create your business first — payments appear here once the company wallet starts receiving money.
                  </EmptyRow>
                ) : rows.length === 0 ? (
                  <EmptyRow>
                    {transactions.length === 0 ? "No payments yet." : "No payments match these filters."}
                  </EmptyRow>
                ) : (
                  rows.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className={cn(
                        "cursor-pointer border-b border-slate-100 text-[15px] last:border-0 hover:bg-[#F8FAFC]",
                        selected?.id === t.id && "bg-[#EFF6FF]"
                      )}
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{shortDateTime(t.createdAt)}</td>
                      <td className="px-6 py-4 font-semibold text-[#0F172A]">{counterparty(t)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500">{t.reference}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-[#0F172A]">
                        {money(t.amount, t.currency)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{t.currency}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{methodLabel(t.type)}</td>
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

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[#2563EB]/30 bg-[#EFF6FF] px-5 py-4 text-[15px]">
            <span className="font-semibold text-[#2563EB]">Summary</span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="text-slate-600">Total Received:</span>
            <span className="font-bold text-[#2563EB]">
              {received.length === 0
                ? money(0, currency === "All" ? "NGN" : currency)
                : received.map((r) => money(r.amount, r.currency)).join(" · ")}
            </span>
            <span className="text-slate-600">across {filtered.length} transactions</span>
          </div>
        )}
      </div>

      {selected && <PaymentDetailPanel transaction={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function shortDateTime(value: string) {
  return new Date(value)
    .toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
}

function EmptyRow({ children }: { children: React.ReactNode }) {
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

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
            option === value ? "bg-[#EFF6FF] text-[#2563EB]" : "text-slate-600 hover:bg-slate-50"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
