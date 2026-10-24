"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, SUPPORT_LINK } from "./nav-items";
import { cn } from "@/lib/utils";

export function Sidebar({ userName, businessName }: { userName: string; businessName: string }) {
  const pathname = usePathname();
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <aside className="hidden h-screen w-[240px] shrink-0 flex-col bg-[#0F172A] lg:sticky lg:top-0 lg:flex">
      <div className="flex h-[72px] items-center gap-2.5 px-6">
        <img src="/rendi-brand-symbol.png" alt="" className="h-9 w-9 rounded-[10px]" />
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
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold text-white">{userName || "Your account"}</span>
          <span className="block truncate text-[12px] text-[#94A3B8]">{businessName || "No business yet"}</span>
        </span>
      </div>
    </aside>
  );
}
