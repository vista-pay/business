"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Where Paystack sends the payer's browser after checkout (the
 * PAYSTACK_CALLBACK_URL). Purely reassurance: the authoritative confirmation
 * is the signed webhook, which credits the wallet whether or not this page
 * is ever seen. Serves two audiences — a mobile-app user funding their
 * wallet (told to return to the app) and a payment-link/invoice payer.
 */
function CompleteInner() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref") ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="w-full max-w-[440px] rounded-[20px] bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,.10)] sm:p-10">
        <div className="flex justify-center">
          <img src="/rendi-brand-symbol.png" alt="Rendi" className="h-12 w-12 rounded-[12px]" />
        </div>
        <span className="mt-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <svg className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none">
            <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="mt-5 text-[22px] font-bold tracking-tight text-[#0F172A]">Payment received</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Thank you — your payment is being confirmed. You&rsquo;ll see it reflected within a few moments.
        </p>
        {reference && (
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Payment reference</p>
            <button
              onClick={() => navigator.clipboard?.writeText(reference)}
              title="Copy reference"
              className="mt-1 break-all font-mono text-sm font-bold text-[#0F172A]"
            >
              {reference} <span className="text-[#2563EB]">⧉</span>
            </button>
          </div>
        )}
        <p className="mt-5 text-[13px] leading-5 text-slate-500">
          Paid from the Rendi app? You can close this window and return to the app.
        </p>
        <p className="mt-4 border-t border-slate-100 pt-4 text-[12px] leading-5 text-slate-400">
          Keep the reference for your records. If the payment doesn&rsquo;t reflect within 10 minutes,
          contact the business you paid or <a href="mailto:support@vistaglobal.io" className="font-semibold text-[#2563EB]">support@vistaglobal.io</a>.
        </p>
      </div>
    </main>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" /></main>}>
      <CompleteInner />
    </Suspense>
  );
}
