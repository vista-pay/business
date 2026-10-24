"use client";
import { useEffect, useMemo, useState } from "react";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Modal } from "@/components/dashboard/modal";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Transaction } from "@/lib/dashboard-data";
import { downloadCsv } from "@/lib/payments";
import { downloadReportPdf, reportCsv } from "@/lib/report-pdf";
import {
  CATEGORY_COLOURS,
  RANGES,
  Range,
  cashFlowTrend,
  rangeStart,
  spendingByCategory,
  statementPeriods,
  summarise,
} from "@/lib/reports";
import { walletMoney } from "@/lib/wallets";
import { cn } from "@/lib/utils";

/** Figma 44:404 — Reports-Dashboard. */
export default function ReportsPage() {
  const { business, loading: shellLoading } = useDashboard();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currencies, setCurrencies] = useState<string[]>(["NGN"]);
  const [currency, setCurrency] = useState("NGN");
  const [range, setRange] = useState<Range>("Last 30 Days");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!business) {
        if (!shellLoading) setLoading(false);
        return;
      }
      const [tx, biz] = await Promise.allSettled([
        businessApi.listTransactions({ businessId: business.id, limit: 500 }),
        businessApi.getBusiness(business.id),
      ]);
      if (cancelled) return;
      if (tx.status === "fulfilled") {
        const items = (tx.value.data as { items?: Transaction[] })?.items;
        setTransactions(Array.isArray(items) ? items : []);
      }
      if (biz.status === "fulfilled") {
        const detail = biz.value.data as { wallet?: { accounts?: Array<{ currencyCode: string }> } };
        const codes = (detail?.wallet?.accounts ?? []).map((a) => a.currencyCode);
        if (codes.length) {
          setCurrencies(codes);
          setCurrency(codes.includes("NGN") ? "NGN" : codes[0]);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [business, shellLoading]);

  const summary = useMemo(() => summarise(transactions, currency, range), [transactions, currency, range]);
  const trend = useMemo(() => cashFlowTrend(transactions, currency, range), [transactions, currency, range]);
  const categories = useMemo(() => spendingByCategory(summary.transactions, currency), [summary, currency]);
  const periods = useMemo(() => statementPeriods(), []);

  function downloadPeriod(period: { label: string; from: Date; to: Date; type: string }) {
    const rows = transactions.filter((t) => {
      const at = new Date(t.createdAt);
      return t.currency === currency && at >= period.from && at < period.to;
    });
    downloadReportPdf(rows, {
      businessName: business?.name ?? "Business",
      title: `${period.type} — ${period.label}`,
      from: period.from,
      to: period.to,
      currency,
      includeTransactions: true,
      includeFees: true,
    });
  }

  return (
    <>
      <PageHeader
        title="Reports & Statement Logs"
        description="Analyze and export historical transaction summaries."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect options={RANGES} value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="Date range" />
            {currencies.length > 1 && (
              <FilterSelect options={currencies} value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency" />
            )}
            <Button variant="brand" size="lg" onClick={() => setGenerating(true)} disabled={!business}>
              Generate Report
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total Inflow" value={walletMoney(summary.inflow, currency)} change={summary.inflowChange} positive />
          <Stat label="Total Outflow" value={walletMoney(summary.outflow, currency)} change={summary.outflowChange} />
          <Stat label="Net Position" value={walletMoney(summary.net, currency)} change={summary.netChange} positive />
          <Stat label="Transaction Count" value={String(summary.count)} change={summary.countChange} positive />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-[17px] font-bold text-[#0F172A]">Cash Flow Trend</h2>
            <div className="mt-3 flex items-center gap-5 text-[13px]">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-[#2563EB]" /> Inflow
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-[#DC2626]" /> Outflow
              </span>
            </div>
            <TrendChart points={trend} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-[17px] font-bold text-[#0F172A]">Spending by Category</h2>
            {categories.length === 0 ? (
              <p className="mt-6 text-[14px] text-slate-500">No outgoing payments in this period.</p>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-6">
                <Donut slices={categories} />
                <ul className="min-w-[160px] flex-1 space-y-2">
                  {categories.map((slice, i) => (
                    <li key={slice.label} className="flex items-center justify-between gap-3 text-[14px]">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: CATEGORY_COLOURS[i % CATEGORY_COLOURS.length] }}
                        />
                        {slice.label}
                      </span>
                      <span className="font-semibold text-[#0F172A]">{slice.share.toFixed(0)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Transactions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[15px] text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : (
                periods.map((period) => {
                  const count = transactions.filter((t) => {
                    const at = new Date(t.createdAt);
                    return t.currency === currency && at >= period.from && at < period.to;
                  }).length;
                  return (
                    <tr key={period.label} className="border-b border-slate-100 text-[15px] last:border-0">
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#0F172A]">{period.label}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{period.type}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-slate-600">{count} transactions</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => downloadPeriod(period)}
                          disabled={count === 0}
                          className="text-[15px] font-semibold text-[#2563EB] hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                        >
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        <p className="text-[13px] text-slate-500">
          Statements are generated on demand from your transaction ledger — there is no stored archive of past exports
          yet, so every period is always current.
        </p>
      </div>

      {generating && business && (
        <GenerateReportModal
          businessName={business.name}
          transactions={transactions}
          currencies={currencies}
          defaultCurrency={currency}
          onClose={() => setGenerating(false)}
        />
      )}
    </>
  );
}

/** Figma 44:564 — Generate-Report. */
function GenerateReportModal({
  businessName,
  transactions,
  currencies,
  defaultCurrency,
  onClose,
}: {
  businessName: string;
  transactions: Transaction[];
  currencies: string[];
  defaultCurrency: string;
  onClose: () => void;
}) {
  const [type, setType] = useState("Transaction Report");
  const [from, setFrom] = useState(rangeStart("Last 30 Days").toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState(defaultCurrency);
  const [format, setFormat] = useState<"PDF" | "CSV">("PDF");
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeFees, setIncludeFees] = useState(true);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const start = new Date(from);
    const end = new Date(to);
    end.setDate(end.getDate() + 1);
    return transactions.filter((t) => {
      const at = new Date(t.createdAt);
      return t.currency === currency && at >= start && at < end;
    });
  }, [transactions, from, to, currency]);

  function generate() {
    setBusy(true);
    try {
      if (format === "CSV") {
        downloadCsv(`${type.toLowerCase().replace(/\s+/g, "-")}-${currency}.csv`, reportCsv(rows));
      } else {
        downloadReportPdf(rows, {
          businessName,
          title: type,
          from: new Date(from),
          to: new Date(to),
          currency,
          includeTransactions,
          includeFees,
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Generate Report" onClose={onClose} width="max-w-[600px]">
      <p className="-mt-3 text-[14px] text-slate-500">Configure parameters for your transaction ledger.</p>

      <hr className="my-5 border-slate-200" />

      <div className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Report Type</span>
          <FilterSelect
            options={["Transaction Report", "Monthly Statement", "Quarterly Report"]}
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-11 border-[#2563EB]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-[15px] text-slate-900 focus:border-[#2563EB] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-[15px] text-slate-900 focus:border-[#2563EB] focus:outline-none"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Currency</span>
          <FilterSelect options={currencies} value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-11" />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Export Format</legend>
          <div className="flex flex-wrap gap-6">
            {(["PDF", "CSV"] as const).map((option) => (
              <label key={option} className="flex items-center gap-2 text-[15px] text-slate-700">
                <input
                  type="radio"
                  checked={format === option}
                  onChange={() => setFormat(option)}
                  className="h-4 w-4 accent-[#2563EB]"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Include in Report</legend>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[15px] text-slate-700">
              <input
                type="checkbox"
                checked={includeTransactions}
                onChange={(e) => setIncludeTransactions(e.target.checked)}
                className="h-[18px] w-[18px] rounded border-slate-300 accent-[#2563EB]"
              />
              Transaction Details
            </label>
            <label className="flex items-center gap-2 text-[15px] text-slate-700">
              <input
                type="checkbox"
                checked={includeFees}
                onChange={(e) => setIncludeFees(e.target.checked)}
                className="h-[18px] w-[18px] rounded border-slate-300 accent-[#2563EB]"
              />
              Fee Breakdown
            </label>
          </div>
        </fieldset>

        <p className="rounded-lg bg-[#EFF6FF] px-4 py-3 text-[14px] text-[#2563EB]">
          {rows.length} transaction{rows.length === 1 ? "" : "s"} in this range — generated instantly in your browser.
        </p>
      </div>

      <div className="mt-7 flex items-center justify-end gap-4">
        <button type="button" onClick={onClose} className="text-[15px] font-semibold text-[#0F172A] hover:underline">
          Cancel
        </button>
        <Button variant="brand" size="lg" onClick={generate} loading={busy} disabled={rows.length === 0}>
          Generate Report
        </Button>
      </div>
    </Modal>
  );
}

function Stat({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: string;
  change: number | null;
  positive?: boolean;
}) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const up = hasChange && change! >= 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[14px] text-slate-500">{label}</p>
      <p className="mt-2 text-[22px] font-bold tracking-tight text-[#0F172A]">{value}</p>
      {hasChange ? (
        <p className={cn("mt-2 text-[13px] font-medium", up === !!positive ? "text-[#16A34A]" : "text-[#DC2626]")}>
          {up ? "↑" : "↓"}
          {Math.abs(change!).toFixed(1)}% <span className="text-slate-400">vs previous period</span>
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-slate-400">No prior period to compare</p>
      )}
    </div>
  );
}

function TrendChart({ points }: { points: Array<{ label: string; inflow: number; outflow: number }> }) {
  const max = Math.max(1, ...points.flatMap((p) => [p.inflow, p.outflow]));
  const width = 520;
  const height = 180;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const path = (key: "inflow" | "outflow") =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - (p[key] / max) * height}`)
      .join(" ");

  if (points.every((p) => p.inflow === 0 && p.outflow === 0)) {
    return <p className="mt-6 text-[14px] text-slate-500">No settled activity in this period.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-lg bg-[#F8FAFC] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[180px] w-full min-w-[420px]" role="img" aria-label="Cash flow trend">
        <path d={path("inflow")} fill="none" stroke="#2563EB" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={path("outflow")} fill="none" stroke="#DC2626" strokeWidth={2.5} strokeLinejoin="round" />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-slate-400">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function Donut({ slices }: { slices: Array<{ label: string; share: number }> }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg viewBox="0 0 140 140" className="h-[140px] w-[140px]" role="img" aria-label="Spending by category">
      {slices.map((slice, i) => {
        const length = (slice.share / 100) * circumference;
        const circle = (
          <circle
            key={slice.label}
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={CATEGORY_COLOURS[i % CATEGORY_COLOURS.length]}
            strokeWidth={22}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 70 70)"
          />
        );
        offset += length;
        return circle;
      })}
    </svg>
  );
}
