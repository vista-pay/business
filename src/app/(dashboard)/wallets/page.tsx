"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { TopBar } from "@/components/dashboard/topbar";
import {
  ExchangeRate,
  WalletAccountDetail,
  availableOf,
  currencyMeta,
  isPrimary,
  pendingOf,
  portfolioValue,
  sortAccounts,
  totalOf,
  walletMoney,
} from "@/lib/wallets";

/** Figma 41:956 — Business-Wallets. */
export default function WalletsPage() {
  const { business, me, loading: shellLoading } = useDashboard();
  const [accounts, setAccounts] = useState<WalletAccountDetail[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!business) {
        if (!shellLoading) setLoading(false);
        return;
      }
      const [biz, fx] = await Promise.allSettled([businessApi.getBusiness(business.id), businessApi.getFxRates()]);
      if (cancelled) return;
      if (biz.status === "fulfilled") {
        const detail = biz.value.data as { wallet?: { accounts?: WalletAccountDetail[] } };
        setAccounts(detail?.wallet?.accounts ?? []);
      }
      if (fx.status === "fulfilled") {
        const list = fx.value.data as ExchangeRate[] | undefined;
        setRates(Array.isArray(list) ? list : []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [business, shellLoading]);

  const sorted = useMemo(() => sortAccounts(accounts), [accounts]);
  const portfolio = useMemo(() => portfolioValue(accounts, rates), [accounts, rates]);
  const initials = [me?.firstName?.[0], me?.lastName?.[0]].filter(Boolean).join("").toUpperCase();

  return (
    <>
      <TopBar firstName={me?.firstName ?? ""} initials={initials} title="Wallets" />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-6">
          <div>
            <p className="text-[14px] text-slate-500">Total Portfolio Value (in NGN)</p>
            <p className="mt-1 text-[26px] font-bold tracking-tight text-[#0F172A] sm:text-[30px]">
              {walletMoney(portfolio.total, "NGN")}
            </p>
            {portfolio.unconverted.length > 0 && (
              <p className="mt-1 text-[13px] text-[#B45309]">
                Excludes {portfolio.unconverted.join(", ")} — no active exchange rate.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled
            title="Currency activation for business wallets is not exposed by the API yet"
            className="shrink-0 rounded-lg bg-[#2563EB] px-5 py-2.5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Add Currency
          </button>
        </section>

        {loading ? (
          <p className="text-[14px] text-slate-500">Loading wallets…</p>
        ) : !business ? (
          <EmptyState />
        ) : sorted.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-[14px] text-slate-500">
            This business has no currency accounts yet.
          </p>
        ) : (
          <section className="grid gap-5 lg:grid-cols-2">
            {sorted.map((account) => {
              const meta = currencyMeta(account.currencyCode);
              const pending = pendingOf(account);
              return (
                <Link
                  key={account.id}
                  href={`/wallets/${account.currencyCode.toLowerCase()}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#2563EB]/40 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">{meta.flag}</span>
                      <span className="text-[12px] font-semibold uppercase text-slate-400">{meta.region}</span>
                      <span className="text-[17px] font-bold text-[#0F172A]">{account.currencyCode} Wallet</span>
                    </span>
                    {isPrimary(account, sorted) && (
                      <span className="shrink-0 rounded-md bg-[#EFF6FF] px-2 py-1 text-[12px] font-semibold text-[#2563EB]">
                        Primary
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-[14px] text-slate-500">Total Balance</p>
                  <p className="text-[24px] font-bold tracking-tight text-[#0F172A] sm:text-[28px]">
                    {walletMoney(totalOf(account), account.currencyCode)}
                  </p>

                  <hr className="my-4 border-slate-200" />

                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <span>
                      <span className="block text-[13px] text-slate-400">Available Balance</span>
                      <span className="block text-[15px] font-semibold text-[#0F172A]">
                        {walletMoney(availableOf(account), account.currencyCode)}
                      </span>
                    </span>
                    {pending > 0 && (
                      <span className="text-right">
                        <span className="block text-[13px] text-slate-400">Pending Settlement</span>
                        <span className="block text-[15px] font-semibold text-[#D97706]">
                          {walletMoney(pending, account.currencyCode)}
                        </span>
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
      <p className="text-[15px] font-semibold text-[#0F172A]">No business wallet yet</p>
      <p className="mx-auto mt-1 max-w-md text-[14px] text-slate-500">
        A wallet is created automatically with your business. Start verification to register one.
      </p>
      <Link
        href="/kyb"
        className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#2563EB] px-5 text-[14px] font-semibold text-white hover:bg-[#1D4ED8]"
      >
        Start verification
      </Link>
    </div>
  );
}
