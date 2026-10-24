import { Button } from "@/components/ui/button";
import { ArrowRightIcon, ClockIcon } from "./icons";

const CHECKLIST = [
  { title: "1. Business Information", description: "Tell us about your business", time: "2 mins" },
  { title: "2. Business Documents", description: "Upload required documents", time: "5 mins" },
  { title: "3. Directors & Owners", description: "Add key people", time: "3 mins" },
  { title: "4. Review & Submit", description: "Verify your details", time: "2 mins" },
  { title: "5. Verification", description: "We review your application", time: "1-3 days" },
];

export function StepWelcome({ onStart, onSaveLater }: { onStart: () => void; onSaveLater: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[640px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <span className="inline-flex rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#2563EB]">
        Step 1 of 5
      </span>

      <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-tight text-[#0F172A] sm:text-[32px]">
        Set Up Your Business Account
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
        Complete your business verification to unlock all Rendi Business features. Ensure you have registration papers
        and owner details ready.
      </p>

      <hr className="my-7 border-slate-200" />

      <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#0F172A]">Onboarding Checklist</h2>
      <ol className="mt-4 space-y-3">
        {CHECKLIST.map((item, i) => (
          <li
            key={item.title}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[12px] font-semibold text-slate-500">
              {i + 1}
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold text-[#0F172A]">{item.title}</span>
              <span className="block text-[13px] text-slate-500">{item.description}</span>
            </span>
            <span className="text-[13px] text-slate-400">{item.time}</span>
          </li>
        ))}
      </ol>

      <Button variant="brand" size="lg" onClick={onStart} className="mt-8 w-full">
        Get Started
        <ArrowRightIcon className="h-4 w-4" />
      </Button>

      <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-slate-500">
        <ClockIcon className="h-4 w-4" />
        Estimated time: <span className="font-semibold text-[#0F172A]">10-15 minutes</span>
      </p>

      <button
        type="button"
        onClick={onSaveLater}
        className="mt-3 block w-full text-center text-[15px] font-semibold text-[#2563EB] underline underline-offset-4"
      >
        Save &amp; Continue Later
      </button>
    </div>
  );
}
