"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlusIcon } from "@/components/kyb/icons";
import { LINK_FILTERS, LinkFilter, PaymentLink, filterLinks, linkStatus, publicUrl } from "@/lib/payment-links";
import { walletMoney } from "@/lib/wallets";
import { cn } from "@/lib/utils";

/** Figma 41:2911 — Payment-Links-List. */
export default function PaymentLinksPage() {
  const { business, loading: shellLoading } = useDashboard();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LinkFilter>("All");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!business) {
        if (!shellLoading) setLoading(false);
        return;
      }
      try {
        const res = await businessApi.listPaymentLinks(business.id);
        if (cancelled) return;
        const list = res.data as PaymentLink[] | undefined;
        setLinks(Array.isArray(list) ? list : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [business, shellLoading]);

  const rows = useMemo(() => filterLinks(links, filter, search), [links, filter, search]);

  async function copy(link: PaymentLink) {
    try {
      await navigator.clipboard.writeText(publicUrl(link.linkHash));
      setCopied(link.id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Payment Links"
        action={
          <Link
            href="/payment-links/new"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-[#2563EB] px-6 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]"
          >
            <PlusIcon className="h-4 w-4" />
            Create Payment Link
          </Link>
        }
      />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {LINK_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
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

          <label className="relative min-w-0 flex-1 sm:max-w-[320px]">
            <span className="sr-only">Search payment links</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payment links..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4">Link</th>
                <th className="px-6 py-4 text-right">Payments</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <Empty>Loading payment links…</Empty>
              ) : !business ? (
                <Empty>Create your business first — payment links collect into the company wallet.</Empty>
              ) : rows.length === 0 ? (
                <Empty>{links.length === 0 ? "No payment links yet." : "No links match this filter."}</Empty>
              ) : (
                rows.map((link) => (
                  <tr key={link.id} className="border-b border-slate-100 text-[15px] last:border-0 hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-semibold text-[#0F172A]">
                      <Link href={`/payment-links/${link.id}`} className="hover:underline">
                        {link.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {link.isFixedAmount && link.amount
                        ? walletMoney(link.amount, link.currencyCode)
                        : "Customer enters"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{link.currencyCode}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-3">
                        <a
                          href={publicUrl(link.linkHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-[#2563EB] hover:underline"
                        >
                          /pay/{link.linkHash.slice(0, 10)}
                        </a>
                        <button
                          type="button"
                          onClick={() => copy(link)}
                          aria-label="Copy link"
                          className="shrink-0 text-[#2563EB] hover:text-[#1D4ED8]"
                        >
                          {copied === link.id ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                              <path d="m5 13 4 4L19 7" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                              <rect x="9" y="9" width="12" height="12" rx="2" />
                              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                            </svg>
                          )}
                        </button>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{link.currentUses}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {new Date(link.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <LinkStatusBadge status={linkStatus(link)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function LinkStatusBadge({ status }: { status: string }) {
  const tone =
    status === "Active"
      ? "bg-[#DCFCE7] text-[#15803D]"
      : status === "Expired"
        ? "bg-[#FEF3C7] text-[#B45309]"
        : status === "Paid"
          ? "bg-[#EFF6FF] text-[#2563EB]"
          : "bg-slate-100 text-slate-600";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-semibold", tone)}>
      {status}
      {status === "Active" && <span aria-hidden="true">✓</span>}
    </span>
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
