"use client";
import { API_BASE } from "@/lib/constants";
export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col bg-[#F8FAFC]">
      <div className="flex h-[68px] items-center border-b border-slate-200 bg-white px-6">
        <h1 className="text-[18px] font-semibold text-[#0F172A]">Business Settings</h1>
      </div>
      <div className="p-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-[#0F172A]">Business Profile</h3>
          <p className="mt-2 text-sm text-slate-500">Manage your business details, KYB status, and wallet settings. All changes are audited.</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-100 py-2"><span className="text-slate-500">API Base</span><span className="font-mono text-xs">{API_BASE}</span></div>
            <div className="flex justify-between py-2"><span className="text-slate-500">Docs</span><a href={API_BASE.replace(/\/api\/v1\/?$/, "") + "/api/docs"} target="_blank" rel="noreferrer" className="text-xs text-[#012A9D] hover:underline">Open →</a></div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-[#0F172A]">Security</h3>
          <p className="mt-2 text-sm text-slate-500">Business actions require personal KYC APPROVED and business membership. Sign out to clear your session.</p>
          <button onClick={() => { localStorage.removeItem("vista_business_token"); document.cookie="vista_business_token=; path=/; max-age=0"; location.href="/login"; }} className="mt-4 w-full rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">Sign out</button>
        </div>
      </div>
    </div>
  );
}
