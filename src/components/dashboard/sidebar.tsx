"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV, SUPPORT_LINK } from "./nav-items";
import { clearSession } from "@/lib/api";
import { cn } from "@/lib/utils";

export function Sidebar({ userName, businessName }: { userName: string; businessName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <aside className="hidden h-screen w-[240px] shrink-0 flex-col bg-[#0F172A] lg:sticky lg:top-0 lg:flex">
      <div className="flex h-[72px] items-center gap-2.5 px-6">
        <img src="/rendi-logo.svg" alt="" className="h-9 w-9 rounded-[10px]" />
        <span className="text-[19px] font-bold tracking-tight text-white">RENDI</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map(({ label, href, Icon }) => {
          const active = pathname === href || (href !== "/overview" && pathname.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] transition-colors",
                active ? "bg-[#2563EB] font-semibold text-white" : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2">
        <Link
          href={SUPPORT_LINK.href}
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] text-[#94A3B8] transition-colors hover:bg-white/5 hover:text-white"
        >
          <SUPPORT_LINK.Icon className="h-[18px] w-[18px]" />
          {SUPPORT_LINK.label}
        </Link>
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white">
          {initials || "--"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-white">{userName || "Your account"}</span>
          <span className="block truncate text-[12px] text-[#94A3B8]">{businessName || "No business yet"}</span>
        </span>
        <button
          onClick={() => { clearSession(); router.replace("/login"); }}
          title="Sign out"
          aria-label="Sign out"
          className="rounded-lg p-2 text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="none"><path d="M12.5 6.5v-2a1.5 1.5 0 0 0-1.5-1.5H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H11a1.5 1.5 0 0 0 1.5-1.5v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M8 10h9m0 0-2.8-2.8M17 10l-2.8 2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </aside>
  );
}
