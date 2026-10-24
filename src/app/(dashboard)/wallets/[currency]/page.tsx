"use client";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { AccountDetailsPanel } from "@/components/dashboard/account-details-panel";
import { NewTransferModal } from "@/components/dashboard/new-transfer-modal";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Transaction, counterparty, isCredit } from "@/lib/dashboard-data";
import { methodLabel, downloadCsv } from "@/lib/payments";
import {
  WalletAccountDetail,
  availableOf,
  pendingOf,
  signedWalletMoney,
  totalOf,
  walletMoney,
} from "@/lib/wallets";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

/** Figma 41:1087 — Wallet-Detail-NGN. */
export default function WalletDetailPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency: raw } = use(params);
  const currency = raw.toUpperCase();
  const { business, loading: shellLoading } = useDashboard();

  const [account, setAccount] = useState<WalletAccountDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAccount, setShowAccount] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    if (!business) {
      if (!shellLoading) setLoading(false);
      return;
    }
    const [biz, tx] = await Promise.allSettled([
      businessApi.getBusiness(business.id),
      // Scoping to one wallet is what lets the API attach each entry's
      // ledger balance, which the Balance column shows.
      businessApi.listTransactions({ businessId: business.id, currencyCode: currency, limit: PAGE_SIZE, page }),
    ]);
    if (biz.status === "fulfilled") {
      const detail = biz.value.data as { wallet?: { accounts?: WalletAccountDetail[] } };
      setAccount(detail?.wallet?.accounts?.find((a) => a.currencyCode === currency) ?? null);
    }
    if (tx.status === "fulfilled") {
      const data = tx.value.data as { items?: Transaction[]; meta?: { total?: number } };
      setTransactions(Array.isArray(data?.items) ? data.items : []);
      setTotal(data?.meta?.total ?? 0);
    }
    setLoading(false);
  }, [business, shellLoading, currency, page]);

  useEffect(() => {
    load();
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const accounts = useMemo(() => (account ? [account] : []), [account]);

  async function downloadStatement() {
    if (!business) return;
    setDownloading(true);
    try {
      const res = await businessApi.getBusinessStatement(business.id);
      const data = res.data as { transactions?: Array<Record<string, unknown>> };
      const rows = (data?.transactions ?? []).filter((t) => t.currency === currency);
      const header = ["Date", "Reference", "Type", "Amount", "Fee", "Currency", "Status"];
      const csv = [
        header,
        ...rows.map((t) => [t.createdAt, t.reference, t.type, t.amount, t.fee, t.currency, t.status]),
      ]
        .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\n");
      downloadCsv(`${currency.toLowerCase()}-statement-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
        <nav className="flex items-center gap-2 text-[17px] sm:text-[19px]">
          <Link href="/wallets" className="text-slate-500 hover:underline">
            Wallets
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-[#0F172A]">{currency} Wallet</span>
        </nav>
        <div className="flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={() => setShowAccount(true)}
            disabled={!account}
            className="text-[15px] font-semibold text-[#2563EB] hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Account Details
          </button>
          <button
            type="button"
            onClick={downloadStatement}
            disabled={!business || downloading}
            className="text-[15px] font-semibold text-[#2563EB] hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {downloading ? "Preparing…" : "Download Statement"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <section className="flex flex-wrap items-start justify-between gap-6 rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-6">
          <div>
            <p className="text-[14px] text-slate-500">Total Balance</p>
            <p className="mt-1 text-[26px] font-bold tracking-tight text-[#0F172A] sm:text-[34px]">
              {walletMoney(account ? totalOf(account) : 0, currency)}
            </p>
          </div>
          <div className="flex flex-wrap gap-6 sm:gap-10">
            <div>
              <p className="text-[13px] text-slate-400">Available Balance</p>
              <p className="mt-0.5 text-[17px] font-bold text-[#16A34A]">
                {walletMoney(account ? availableOf(account) : 0, currency)}
              </p>
            </div>
            <div>
              <p className="text-[13px] text-slate-400">Pending Settlement</p>
              <p className="mt-0.5 text-[17px] font-bold text-[#D97706]">
                {walletMoney(account ? pendingOf(account) : 0, currency)}
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Action label="Add Money" onClick={() => setShowAccount(true)} disabled={!account} icon="plus" />
          <Action label="Send" href="/transfers" icon="send" />
          <Action label="Receive" onClick={() => setShowAccount(true)} disabled={!account} icon="receive" />
          <Action label="Withdraw" onClick={() => setTransferring(true)} disabled={!account} icon="bank" />
          <Action
            label="Convert"
            disabled
            title="FX conversion is not available for business wallets yet"
            icon="convert"
          />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-[17px] font-bold text-[#0F172A]">Transaction History</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3 text-right">Balance</th>
                  <th className="px-3 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <Empty>Loading transactions…</Empty>
                ) : !business ? (
                  <Empty>Create your business to open a company wallet.</Empty>
                ) : transactions.length === 0 ? (
                  <Empty>No transactions on this wallet yet.</Empty>
                ) : (
                  transactions.map((t) => {
                    const credit = isCredit(t.type);
                    return (
                      <tr key={t.id} className="border-b border-slate-100 text-[15px] last:border-0">
                        <td className="whitespace-nowrap px-3 py-4 text-slate-600">{shortDateTime(t.createdAt)}</td>
                        <td className="px-3 py-4 font-semibold text-[#0F172A]">
                          {counterparty(t)} — {methodLabel(t.type)}
                        </td>
                        <td className="px-3 py-4 text-slate-600">{credit ? "Credit" : "Debit"}</td>
                        <td
                          className={cn(
                            "whitespace-nowrap px-3 py-4 text-right font-bold",
                            credit ? "text-[#16A34A]" : "text-[#DC2626]"
                          )}
                        >
                          {signedWalletMoney(t.amount, t.currency, credit)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right text-slate-600">
                          {t.balanceAfter ? walletMoney(t.balanceAfter, t.currency) : "—"}
                        </td>
                        <td className="px-3 py-4 text-right">
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] text-slate-500">
              Showing {transactions.length} of {total} transactions
            </p>
            <div className="flex items-center gap-3">
              <PagerButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </PagerButton>
              <span className="text-[14px] text-slate-600">
                Page {page} of {pageCount}
              </span>
              <PagerButton onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>
                Next
              </PagerButton>
            </div>
          </div>
        </section>
      </div>

      {showAccount && account && (
        <AccountDetailsPanel
          account={account}
          businessName={business?.name ?? ""}
          businessStatus={business?.status ?? "PENDING"}
          onClose={() => setShowAccount(false)}
        />
      )}

      {transferring && business && (
        <NewTransferModal
          businessId={business.id}
          accounts={accounts}
          onClose={() => setTransferring(false)}
          onDone={() => {
            setTransferring(false);
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

const ICONS: Record<string, React.ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  send: (
    <>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  receive: (
    <>
      <path d="M17 7 7 17" />
      <path d="M16 17H7V8" />
    </>
  ),
  bank: (
    <>
      <path d="M3 10h18" />
      <path d="m12 3 9 5H3Z" />
      <path d="M5 10v8M12 10v8M19 10v8" />
      <path d="M3 20h18" />
    </>
  ),
  convert: (
    <>
      <path d="M4 10a8 8 0 0 1 13-5l3 2" />
      <path d="M20 14a8 8 0 0 1-13 5l-3-2" />
    </>
  ),
};

function Action({
  label,
  icon,
  href,
  onClick,
  disabled,
  title,
}: {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const className = cn(
    "inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[15px] font-semibold text-[#0F172A] transition-colors hover:bg-slate-50",
    disabled && "cursor-not-allowed text-slate-400 hover:bg-white"
  );
  const glyph = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] text-[#2563EB]" aria-hidden="true">
      {ICONS[icon]}
    </svg>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {glyph}
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={className}>
      {glyph}
      {label}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={6} className="px-3 py-12 text-center text-[15px] text-slate-500">
        {children}
      </td>
    </tr>
  );
}

function PagerButton({
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
