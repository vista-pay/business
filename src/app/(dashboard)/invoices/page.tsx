"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlusIcon } from "@/components/kyb/icons";
import { INVOICE_FILTERS, Invoice, InvoiceFilter, filterInvoices, invoiceTotals } from "@/lib/payment-links";
import { walletMoney } from "@/lib/wallets";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

/** Figma 41:3294 — Invoices-List. */
export default function InvoicesPage() {
  const { business, loading: shellLoading } = useDashboard();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InvoiceFilter>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!business) {
        if (!shellLoading) setLoading(false);
        return;
      }
      try {
        const res = await businessApi.listInvoices(business.id);
        if (cancelled) return;
        const list = res.data as Invoice[] | undefined;
        setInvoices(Array.isArray(list) ? list : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [business, shellLoading]);

  const totals = useMemo(() => invoiceTotals(invoices), [invoices]);
  const filtered = useMemo(() => filterInvoices(invoices, filter, search), [invoices, filter, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Invoices"
        action={
          <Link
            href="/invoices/new"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-[#2563EB] px-6 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]"
          >
            <PlusIcon className="h-4 w-4" />
            Create Invoice
          </Link>
        }
      />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <TotalCard label="Total Outstanding" amounts={totals.outstanding} />
          <TotalCard label="Overdue" amounts={totals.overdue} tone="text-[#DC2626]" />
          <TotalCard label="Paid This Month" amounts={totals.paidThisMonth} tone="text-[#16A34A]" />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {INVOICE_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setFilter(option);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg border px-4 py-2 text-[14px] font-semibold transition-colors",
                  option === filter
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="relative min-w-0 flex-1 sm:max-w-[280px]">
            <span className="sr-only">Search invoices</span>
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
              placeholder="Search invoices..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <Empty>Loading invoices…</Empty>
              ) : !business ? (
                <Empty>Create your business first — invoices are issued against the company.</Empty>
              ) : rows.length === 0 ? (
                <Empty>
                  {filter === "Viewed"
                    ? "No invoices here. The API's invoice status has no VIEWED value yet — invoices move Draft → Sent → Paid."
                    : invoices.length === 0
                      ? "No invoices yet."
                      : "No invoices match this filter."}
                </Empty>
              ) : (
                rows.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 text-[15px] last:border-0 hover:bg-[#F8FAFC]">
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#2563EB]">
                      <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#0F172A]">{invoice.customerName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {walletMoney(invoice.totalAmount, invoice.currencyCode)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{invoice.currencyCode}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {new Date(invoice.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <InvoiceBadge status={invoice.status} />
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
              ? "Showing 0 invoices"
              : `Showing ${(current - 1) * PAGE_SIZE + 1} to ${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length} invoices`}
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
    </>
  );
}

function TotalCard({
  label,
  amounts,
  tone = "text-[#0F172A]",
}: {
  label: string;
  amounts: Array<{ currency: string; amount: number }>;
  tone?: string;
}) {
  const multi = amounts.length > 1;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-slate-500">{label}</p>
      {amounts.length === 0 ? (
        <p className={cn("mt-2 text-[24px] font-bold tracking-tight", tone)}>{walletMoney(0, "NGN")}</p>
      ) : (
        <div className="mt-2 space-y-0.5">
          {amounts.map((a) => (
            <p key={a.currency} className={cn("font-bold tracking-tight", tone, multi ? "text-[18px]" : "text-[24px]")}>
              {walletMoney(a.amount, a.currency)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceBadge({ status }: { status: string }) {
  const value = status.toUpperCase();
  const tone =
    value === "PAID"
      ? "bg-[#DCFCE7] text-[#15803D]"
      : value === "OVERDUE"
        ? "bg-[#FEF3C7] text-[#B45309]"
        : value === "SENT"
          ? "bg-[#EFF6FF] text-[#2563EB]"
          : value === "CANCELLED"
            ? "bg-red-100 text-red-700"
            : "bg-slate-100 text-slate-600";
  const label = value.charAt(0) + value.slice(1).toLowerCase();
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-semibold", tone)}>
      {label}
      {value === "PAID" && <span aria-hidden="true">✓</span>}
      {value === "OVERDUE" && <span aria-hidden="true">⚠</span>}
    </span>
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

function Pager({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
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
