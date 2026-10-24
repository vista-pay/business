"use client";
import { useEffect, useMemo, useState } from "react";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { TopBar } from "@/components/dashboard/topbar";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  InvoicePlusIcon,
  LinkIcon,
  ReceiveIcon,
  SendIcon,
} from "@/components/dashboard/icons";
import {
  Invoice,
  Transaction,
  activitySummary,
  counterparty,
  isCredit,
  money,
  outstandingInvoices,
  signedMoney,
  typeLabel,
} from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

const QUICK_ACTIONS = [
  { label: "Receive Payment", href: "/payments", Icon: ReceiveIcon },
  { label: "Send Money", href: "/transfers", Icon: SendIcon },
  { label: "Create Invoice", href: "/invoices", Icon: InvoicePlusIcon },
  { label: "Create Payment Link", href: "/payment-links", Icon: LinkIcon },
];

export default function OverviewPage() {
  const { business, me, loading: shellLoading } = useDashboard();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 100 rows is enough to cover today and yesterday for the daily deltas.
      // Without a business there is nothing company-scoped to show yet.
      const [tx, inv] = await Promise.allSettled([
        business
          ? businessApi.listTransactions({ limit: 100, businessId: business.id })
          : Promise.resolve({ data: { items: [] } }),
        business ? businessApi.listInvoices(business.id) : Promise.resolve({ data: [] }),
      ]);
      if (cancelled) return;
      if (tx.status === "fulfilled") {
        const items = (tx.value.data as { items?: Transaction[] })?.items;
        setTransactions(Array.isArray(items) ? items : []);
      }
      if (inv.status === "fulfilled") {
        const list = inv.value.data as Invoice[] | undefined;
        setInvoices(Array.isArray(list) ? list : []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [business]);

  const balance = useMemo(
    () => (business?.wallet?.accounts ?? []).reduce((sum, a) => sum + (Number(a.availableBalance) || 0), 0),
    [business]
  );
  const activity = useMemo(() => activitySummary(transactions), [transactions]);
  const outstanding = useMemo(() => outstandingInvoices(invoices), [invoices]);
  const recent = transactions.slice(0, 5);

  const needsVerification = !shellLoading && (!business || business.status !== "APPROVED");

  const initials = [me?.firstName?.[0], me?.lastName?.[0]].filter(Boolean).join("").toUpperCase();

  return (
    <>
      <TopBar firstName={me?.firstName ?? ""} initials={initials} />
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {needsVerification && <VerificationBanner hasBusiness={!!business} kycStatus={me?.kycStatus ?? "NOT_STARTED"} />}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current Balance" value={money(balance)} footer="Across all wallets" />
        <StatCard label="Received Today" value={money(activity.receivedToday)} delta={activity.receivedDelta} positive />
        <StatCard label="Paid Today" value={money(activity.paidToday)} delta={activity.paidDelta} />
        <StatCard
          label="Pending Settlements"
          value={money(activity.pendingSettlements)}
          footer="Settling within 24h"
        />
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-[#0F172A]">Quick Actions</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map(({ label, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[15px] font-semibold text-[#0F172A]">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-[#0F172A]">Recent Transactions</h2>
            <Link href="/payments" className="text-[14px] font-semibold text-[#2563EB] hover:underline">
              View All
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-6 text-[14px] text-slate-500">No transactions yet.</p>
          ) : (
            <ul className="mt-4">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-0 sm:gap-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-[#0F172A]">{counterparty(t)}</span>
                    <span className="block text-[13px] text-slate-500">
                      {new Date(t.createdAt)
                        .toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", hour12: true })
                        .replace(/\b(am|pm)\b/i, (m) => m.toUpperCase())}
                      <span className="sm:hidden"> · {typeLabel(t.type)}</span>
                    </span>
                  </span>
                  <span className="hidden w-32 shrink-0 text-[14px] text-slate-600 sm:block">{typeLabel(t.type)}</span>
                  <span className="shrink-0 text-right">
                    <span
                      className={cn(
                        "block whitespace-nowrap text-[15px] font-semibold sm:w-36",
                        t.status === "SUCCESS"
                          ? isCredit(t.type)
                            ? "text-[#16A34A]"
                            : "text-[#DC2626]"
                          : "text-[#B45309]"
                      )}
                    >
                      {signedMoney(t)}
                    </span>
                    <span className="mt-1 block sm:hidden">
                      <StatusBadge status={t.status} />
                    </span>
                  </span>
                  <span className="hidden w-24 shrink-0 text-right sm:block">
                    <StatusBadge status={t.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-[17px] font-bold text-[#0F172A]">Outstanding Invoices</h2>
          <p className="mt-1 text-[14px] text-slate-500">
            {outstanding.items.length} Outstanding: {money(outstanding.total, outstanding.currency)} total
          </p>

          {outstanding.items.length === 0 ? (
            <p className="mt-6 text-[14px] text-slate-500">Nothing outstanding.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {outstanding.items.slice(0, 3).map((invoice) => (
                <li key={invoice.id} className="rounded-xl border border-slate-200 px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] font-semibold text-[#0F172A]">{invoice.invoiceNumber}</span>
                    <InvoiceBadge status={invoice.status} />
                  </div>
                  <div className="mt-1.5 flex items-end justify-between gap-3">
                    <span className="truncate text-[13px] text-slate-500">{invoice.customerName}</span>
                    <span className="shrink-0 text-[15px] font-bold text-[#0F172A]">
                      {money(invoice.totalAmount, invoice.currencyCode)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  footer,
  delta,
  positive,
}: {
  label: string;
  value: string;
  footer?: string;
  delta?: number | null;
  positive?: boolean;
}) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = hasDelta && delta! >= 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[14px] text-slate-500">{label}</p>
      <p className="mt-2 text-[24px] font-bold tracking-tight text-[#0F172A]">{value}</p>
      {hasDelta ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 text-[13px] font-medium",
            up === !!positive ? "text-[#16A34A]" : "text-[#DC2626]"
          )}
        >
          {up ? <ArrowUpRightIcon className="h-3.5 w-3.5" /> : <ArrowDownLeftIcon className="h-3.5 w-3.5" />}
          {up ? "+" : ""}
          {delta!.toFixed(1)}% vs yesterday
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-slate-400">{footer ?? "No change vs yesterday"}</p>
      )}
    </div>
  );
}


function InvoiceBadge({ status }: { status: string }) {
  const tone =
    status === "OVERDUE"
      ? "bg-red-100 text-red-700"
      : status === "SENT"
        ? "bg-[#EFF6FF] text-[#2563EB]"
        : "bg-[#FEF3C7] text-[#B45309]";
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[12px] font-semibold", tone)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

/**
 * The dashboard reads as empty until a business is verified, so say why and
 * point at the step that fixes it rather than leaving the zeros unexplained.
 */
function VerificationBanner({ hasBusiness, kycStatus }: { hasBusiness: boolean; kycStatus: string }) {
  const kycApproved = kycStatus === "APPROVED";
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#F59E0B] bg-[#FEF3C7] px-5 py-4">
      <div>
        <p className="text-[15px] font-semibold text-[#B45309]">
          {hasBusiness ? "Business verification in review" : "Finish setting up your business account"}
        </p>
        <p className="text-[14px] text-[#B45309]">
          {hasBusiness
            ? "Wallets and payments unlock once your KYB application is approved."
            : kycApproved
              ? "Complete KYB verification to unlock wallets, payments and payouts."
              : `Your personal KYC is ${kycStatus.replace(/_/g, " ").toLowerCase()} — it must be approved before you can register a business.`}
        </p>
      </div>
      {!hasBusiness && (
        <Link
          href="/kyb"
          className="shrink-0 rounded-lg bg-[#2563EB] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
        >
          Start verification
        </Link>
      )}
    </div>
  );
}
