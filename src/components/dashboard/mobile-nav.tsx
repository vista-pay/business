"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, SUPPORT_LINK } from "./nav-items";
import { cn } from "@/lib/utils";
import { clearSession } from "@/lib/api";

/** Below the `lg` breakpoint the rail is replaced by this bar plus a drawer. */
export function MobileNav({ userName, businessName }: { userName: string; businessName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#0F172A] px-4 lg:hidden">
        <span className="flex items-center gap-2">
          <img src="/rendi-brand-symbol.png" alt="" className="h-7 w-7 rounded-lg" />
          <span className="text-[16px] font-bold tracking-tight text-white">RENDI</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-y-0 left-0 flex w-[270px] max-w-[85vw] flex-col bg-[#0F172A]">
            <div className="flex h-14 items-center justify-between px-4">
              <span className="flex items-center gap-2">
                <img src="/rendi-brand-symbol.png" alt="" className="h-7 w-7 rounded-lg" />
                <span className="text-[16px] font-bold tracking-tight text-white">RENDI</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              {NAV.map(({ label, href, Icon }) => {
                const active = pathname === href || (href !== "/overview" && pathname.startsWith(href));
                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-lg px-3 text-[14px]",
                      active ? "bg-[#2563EB] font-semibold text-white" : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {label}
                  </Link>
                );
              })}
              <Link
                href={SUPPORT_LINK.href}
                onClick={() => setOpen(false)}
                className="flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] text-[#94A3B8] hover:bg-white/5 hover:text-white"
              >
                <SUPPORT_LINK.Icon className="h-[18px] w-[18px]" />
                {SUPPORT_LINK.label}
              </Link>
            </nav>

            <div className="border-t border-white/10 px-5 py-4">
              <span className="block truncate text-[14px] font-semibold text-white">{userName || "Your account"}</span>
              <span className="block truncate text-[12px] text-[#94A3B8]">{businessName || "No business yet"}</span>
              <button
                onClick={() => { clearSession(); window.location.href = "/login"; }}
                className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-white/10 text-[13px] font-semibold text-white"
              >Sign out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
