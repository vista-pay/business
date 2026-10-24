"use client";
import { BellIcon } from "./icons";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function TopBar({
  firstName,
  initials,
  title,
}: {
  firstName: string;
  initials: string;
  /** Page title. Without one the bar greets the signed-in user, as on Overview. */
  title?: string;
}) {
  // The greeting follows the viewer's clock, which the server cannot know, so
  // the text is allowed to differ from the SSR output rather than mismatching.
  const hour = new Date().getHours();
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:h-[72px] sm:px-8">
      <h1
        suppressHydrationWarning
        className="truncate text-[17px] font-bold tracking-tight text-[#0F172A] sm:text-[20px]"
      >
        {title ?? `${greeting(hour)}${firstName ? `, ${firstName}` : ""}`}
      </h1>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <BellIcon className="h-[18px] w-[18px]" />
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-[13px] font-semibold text-white">
          {initials || "--"}
        </span>
      </div>
    </header>
  );
}
