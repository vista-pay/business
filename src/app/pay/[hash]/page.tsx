"use client";
import { use, useEffect, useState } from "react";
import { businessApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { idempotencyKey } from "@/lib/transfers";
import { walletMoney } from "@/lib/wallets";

type PublicLink = {
  id: string;
  linkHash: string;
  title: string;
  description?: string | null;
  amount?: string | null;
  currency: string;
  isFixedAmount: boolean;
  merchantName?: string;
};

/**
 * Figma 41:3255 — Public-Payment-Page. Served outside the dashboard shell: the
 * payer is a customer, not a signed-in portal user.
 */
export default function PublicPaymentPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const [link, setLink] = useState<PublicLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    businessApi
      .getPaymentLink(hash)
      .then((res) => {
        if (!cancelled) setLink(res.data as PublicLink);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "This payment link is not available.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hash]);

  const payable = link?.isFixedAmount ? Number(link.amount ?? 0) : Number(amount);
  const canPay = Boolean(link) && name.trim() && email.trim() && payable > 0 && !paying;

  async function pay() {
    if (!link) return;
    setPaying(true);
    setError(null);
    try {
      const res = await businessApi.payPaymentLink(
        link.linkHash,
        {
          customerName: name.trim(),
          customerEmail: email.trim(),
          ...(link.isFixedAmount ? {} : { amount: String(payable) }),
        },
        idempotencyKey()
      );
      const data = res.data as { checkoutUrl?: string; authorizationUrl?: string; reference?: string };
      const redirect = data?.checkoutUrl ?? data?.authorizationUrl;
      if (redirect) {
        window.location.href = redirect;
        return;
      }
      setDone(data?.reference ?? "Payment initialised");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "The payment could not be started.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 sm:p-6">
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        {loading ? (
          <p className="py-10 text-center text-[15px] text-slate-500">Loading…</p>
        ) : !link ? (
          <div className="py-10 text-center">
            <p className="text-[16px] font-semibold text-[#0F172A]">Link unavailable</p>
            <p className="mt-1 text-[14px] text-slate-500">{error ?? "This payment link is no longer active."}</p>
          </div>
        ) : done ? (
          <div className="py-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7]">
              <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                <path d="m5 13 4 4L19 7" />
              </svg>
            </span>
            <h1 className="mt-4 text-[20px] font-bold tracking-tight text-[#0F172A]">Payment started</h1>
            <p className="mt-1 text-[14px] text-slate-500">Reference {done}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <img src="/rendi-brand-symbol.png" alt="" className="h-12 w-12 rounded-xl" />
              <span>
                <span className="flex items-center gap-1.5 text-[15px] font-bold text-[#0F172A]">
                  {link.merchantName ?? "Rendi merchant"}
                  <svg viewBox="0 0 24 24" fill="#2563EB" className="h-4 w-4" aria-label="Verified business">
                    <path d="M12 2 9.8 4.2 6.7 4l-.3 3.1L4 9.8 5.6 12 4 14.2l2.4 2.7.3 3.1 3.1-.2L12 22l2.2-2.2 3.1.2.3-3.1L20 14.2 18.4 12 20 9.8l-2.4-2.7-.3-3.1-3.1.2Z" />
                    <path d="m10.6 14.6-2-2 .9-1 1.1 1.1 2.9-3 1 1Z" fill="#fff" />
                  </svg>
                </span>
                <span className="block text-[13px] text-slate-500">Secured payment page</span>
              </span>
            </div>

            <hr className="my-5 border-slate-200" />

            <h1 className="text-[22px] font-bold tracking-tight text-[#0F172A]">{link.title}</h1>
            {link.description && <p className="mt-1 text-[14px] text-slate-500">{link.description}</p>}

            <div className="mt-4 rounded-xl bg-[#EFF6FF] px-5 py-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-[#2563EB]">Total Amount</p>
              <p className="mt-1 text-[26px] font-bold tracking-tight text-[#2563EB]">
                {link.isFixedAmount && link.amount
                  ? walletMoney(link.amount, link.currency)
                  : payable > 0
                    ? walletMoney(payable, link.currency)
                    : "Enter an amount"}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {!link.isFixedAmount && (
                <Input
                  label="Amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0.00"
                />
              )}
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tunde Bakare" />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. tunde@email.com"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <button
              type="button"
              onClick={pay}
              disabled={!canPay}
              className="mt-5 h-12 w-full rounded-lg bg-[#2563EB] text-[15px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {paying
                ? "Starting payment…"
                : payable > 0
                  ? `Pay ${walletMoney(payable, link.currency)}`
                  : "Pay"}
            </button>

            <p className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-slate-500">
              <span>Accepted Methods:</span>
              <span className="flex gap-4 font-semibold text-[#0F172A]">
                <span>Card</span>
                <span>Bank Transfer</span>
                <span>Rendi Pay</span>
              </span>
            </p>

            <hr className="my-5 border-slate-200" />

            <p className="flex items-center justify-center gap-1.5 text-[13px] text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Secured by Rendi
            </p>
          </>
        )}
      </div>
    </main>
  );
}
