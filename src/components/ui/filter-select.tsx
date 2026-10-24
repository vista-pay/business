import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Compact filter dropdown. Native selects render the OS arrow at an awkward
 * offset inside a 40px control, so the arrow is drawn here instead.
 */
export function FilterSelect({
  options,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[] }) {
  return (
    <div className="relative shrink-0">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm font-medium text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
