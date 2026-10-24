"use client";
import { useEffect, useState } from "react";
import { businessApi } from "@/lib/api";
import { SidePanel } from "./side-panel";
import { StatusBadge } from "./status-badge";
import { Transaction, counterparty, money } from "@/lib/dashboard-data";
import { methodLabel } from "@/lib/payments";
import Link from "next/link";

type Detail = Transaction & {
  netAmount?: string;
  fee?: string;
  providerReference?: string | null;
  completedAt?: string | null;
  failureReason?: string | null;
  depositDetails?: Record<string, unknown> | null;
  withdrawalDetails?: Record<string, unknown> | null;
  transferDetails?: { sender?: string; recipient?: string; narration?: string } | null;
};

/** Figma 41:1906 — Payment-Detail-Panel. */
export function PaymentDetailPanel({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail>(transaction as Detail);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    businessApi
      .getTransaction(transaction.id)
      .then((res) => {
        if (!cancelled && res.data) setDetail({ ...(transaction as Detail), ...(res.data as Detail) });
      })
      .catch(() => {
        // The row we already have is enough to show the summary.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [transaction]);

  const source = sourceLabel(detail);
  const settlement = detail.status === "SUCCESS" ? `Settled to ${detail.currency} wallet` : "Not settled yet";

  return (
    <SidePanel title="Payment Details" onClose={onClose}>
      <div className="rounded-xl bg-[#EFF6FF] px-5 py-6 text-center">
        <StatusBadge status={detail.status} className="bg-[#DCFCE7]" />
        <p className="mt-3 text-[26px] font-bold tracking-tight text-[#2563EB]">
          {money(detail.amount, detail.currency)}
        </p>
        <p className="mt-1 text-[14px] text-slate-600">{counterparty(detail)}</p>
      </div>

      <dl className="mt-6 text-[15px]">
        <Row label="Reference" value={detail.reference} />
        <Row label="Method" value={methodLabel(detail.type)} />
        <Row label="Date" value={fullDateTime(detail.createdAt)} />
        <Row label="Source" value={source} />
        <Row label="Settlement" value={settlement} />
        <Row label="Fee" value={money(detail.fee ?? "0", detail.currency)} />
        <Row
          label="Net"
          value={money(detail.netAmount ?? detail.amount, detail.currency)}
          emphasis
        />
        {detail.failureReason && <Row label="Failure reason" value={detail.failureReason} />}
      </dl>

      {loading && <p className="mt-3 text-[13px] text-slate-400">Loading full details…</p>}

      <div className="mt-7 space-y-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="h-11 w-full rounded-lg bg-[#2563EB] text-[15px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
        >
          Send Receipt
        </button>
        <Link
          href="/beneficiaries"
          className="flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-[15px] font-semibold text-[#0F172A] transition-colors hover:bg-slate-50"
        >
          View Customer
        </Link>
        <Link href="/support" className="block py-1 text-center text-[15px] font-semibold text-[#DC2626] hover:underline">
          Report Issue
        </Link>
      </div>
    </SidePanel>
  );
}

function sourceLabel(detail: Detail) {
  const deposit = detail.depositDetails as Record<string, unknown> | null | undefined;
  const bank = deposit?.bankName ?? deposit?.sourceBankName;
  const account = deposit?.accountNumber ?? deposit?.sourceAccountNumber;
  if (typeof bank === "string" && typeof account === "string") return `${bank} ****${account.slice(-4)}`;
  if (typeof bank === "string") return bank;
  if (detail.transferDetails?.sender) return detail.transferDetails.sender;
  if (detail.providerReference) return `Provider ref ${detail.providerReference}`;
  return methodLabel(detail.type);
}

function fullDateTime(value: string) {
  return new Date(value)
    .toLocaleString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={emphasis ? "text-right font-bold text-[#0F172A]" : "text-right font-semibold text-[#0F172A]"}>
        {value}
      </dd>
    </div>
  );
}
