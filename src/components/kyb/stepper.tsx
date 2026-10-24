import { CheckCircleIcon } from "./icons";
import { KYB_STEPS } from "@/lib/kyb";
import { cn } from "@/lib/utils";

/** Horizontal 5-node progress rail shown above the wizard card. */
export function KybStepper({ step }: { step: number }) {
  return (
    <ol className="mx-auto flex max-w-[800px] items-center justify-between gap-3 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {KYB_STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={s.label} className="flex shrink-0 items-center gap-2 lg:flex-1 lg:last:flex-none">
            <div className="flex items-center gap-2.5">
              {done ? (
                <CheckCircleIcon className="h-6 w-6 shrink-0 text-[#16A34A]" />
              ) : (
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    current ? "bg-[#2563EB] text-white" : "border border-slate-300 bg-white text-slate-400"
                  )}
                >
                  {i + 1}
                </span>
              )}
              <span
                className={cn(
                  "whitespace-nowrap text-[13px]",
                  current ? "font-semibold text-[#2563EB]" : done ? "text-[#0F172A]" : "text-slate-400"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < KYB_STEPS.length - 1 && (
              <span className={cn("hidden h-px flex-1 lg:block", done ? "bg-[#16A34A]" : "bg-slate-200")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
