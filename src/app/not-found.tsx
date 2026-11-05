import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested Rendi Business page could not be found.",
};

export default function NotFound() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#F8FAFC] px-5 py-6 sm:px-8">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#012A9D] via-[#2563EB] to-[#38BDF8]" />
      <div aria-hidden className="absolute -right-32 -top-32 h-[430px] w-[430px] rounded-full bg-blue-100/70 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <Link href="/overview" className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            <img src="/rendi-logo.svg" alt="" className="h-10 w-10 rounded-xl bg-white shadow-sm" />
            <div>
              <p className="text-[15px] font-extrabold tracking-tight text-[#0F172A]">RENDI</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">Business</p>
            </div>
          </Link>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">404</span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1fr_440px]">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2563EB]">Page not found</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-[#0F172A] sm:text-5xl lg:text-6xl">
              This page isn&rsquo;t on the books.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              The address may be incorrect or the page may have moved. Your wallets, transfers and payment records are unaffected.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/overview" className="inline-flex h-12 items-center justify-center rounded-xl bg-[#012A9D] px-6 text-sm font-semibold text-white shadow-[0_10px_25px_-8px_rgba(1,42,157,.45)] transition hover:bg-[#011E7A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
                Go to business overview <span aria-hidden className="ml-2">→</span>
              </Link>
              <Link href="/support" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
                Contact support
              </Link>
            </div>
          </div>

          <div aria-hidden className="relative mx-auto w-full max-w-[440px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-30px_rgba(15,23,42,.3)] sm:p-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 h-7 flex-1 rounded-lg bg-slate-100" />
            </div>
            <div className="py-10 text-center">
              <p className="text-[96px] font-extrabold leading-none tracking-[-0.08em] text-[#012A9D]">404</p>
              <div className="mx-auto mt-7 h-2 w-40 rounded-full bg-slate-100" />
              <div className="mx-auto mt-3 h-2 w-24 rounded-full bg-blue-100" />
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 py-5 text-xs text-slate-500">Rendi Business · Payments, payouts and reconciliation for teams.</footer>
      </div>
    </main>
  );
}
