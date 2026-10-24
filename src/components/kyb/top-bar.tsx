import { KYB_STEPS } from "@/lib/kyb";
import Link from "next/link";

/**
 * Onboarding header: brand lockup on the left, the current step in the middle
 * (absent on the welcome and submitted screens), support on the right.
 */
export function KybTopBar({ step }: { step: number | null }) {
  const current = step !== null ? KYB_STEPS[step] : null;
  return (
    <header className="relative flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-10">
      <div className="flex items-center gap-2.5">
        <img src="/rendi-brand-symbol.png" alt="Rendi" className="h-9 w-9 rounded-[10px]" />
        <span className="text-[20px] font-bold tracking-tight text-[#0F172A]">RENDI</span>
        <span className="rounded-md bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2563EB]">
          Business
        </span>
      </div>

      {current && (
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[15px] lg:flex">
          <span className="font-semibold text-[#2563EB]">
            Step {step! + 1} of {KYB_STEPS.length}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[#0F172A]">{current.title}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="hidden text-[15px] text-slate-600 sm:inline">Need help?</span>
        <Link
          href="/settings"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-slate-50"
        >
          Contact Support
        </Link>
      </div>
    </header>
  );
}
