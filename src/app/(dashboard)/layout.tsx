"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api";
import { DashboardProvider, useDashboard } from "@/components/dashboard/dashboard-context";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    else setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardProvider>
      <Shell>{children}</Shell>
    </DashboardProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { me, business } = useDashboard();
  const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(" ");

  // Each page renders its own header bar (the dashboard's is the greeting bar
  // from the design; the remaining stubs still carry their own title bars).
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar userName={fullName} businessName={business?.name ?? ""} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <MobileNav userName={fullName} businessName={business?.name ?? ""} />
        {children}
      </div>
    </div>
  );
}
