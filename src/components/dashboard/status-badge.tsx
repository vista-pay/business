import { statusLabel } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const FAILED = new Set(["FAILED", "CANCELLED", "REVERSED"]);

/** Transaction status pill - green / amber / red, as in the Payments frames. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = status === "SUCCESS"
    ? "bg-[#DCFCE7] text-[#15803D]"
    : FAILED.has(status)
      ? "bg-red-100 text-red-700"
      : "bg-[#FEF3C7] text-[#B45309]";

  const mark = status === "SUCCESS" ? "✓" : FAILED.has(status) ? "✕" : "⏳";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold", tone, className)}>
      {statusLabel(status)}
      <span aria-hidden="true">{mark}</span>
    </span>
  );
}
