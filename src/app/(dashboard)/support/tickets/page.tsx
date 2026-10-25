"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SupportTicketSummary, TicketCounts, businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PriorityText, StatusPill, fmtDate } from "@/components/support/support-ui";

export default function TicketListPage() {
  const { business } = useDashboard() as { business: { id: string } | null };
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [counts, setCounts] = useState<TicketCounts | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await businessApi.listTickets(business ? { businessId: business.id } : undefined);
      setTickets(res.data.tickets);
      setCounts(res.data.counts);
    } catch { /* list stays empty */ }
    finally { setLoading(false); }
  }, [business]);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => tickets.filter((t) => {
    if (status !== "All" && t.status !== status) return false;
    if (priority !== "All" && t.priority !== priority.toUpperCase()) return false;
    const q = query.trim().toLowerCase();
    if (q && !`${t.reference} ${t.subject} ${t.categoryLabel}`.toLowerCase().includes(q)) return false;
    return true;
  }), [tickets, status, priority, query]);

  const tiles = counts ? [
    { label: "Total Tickets", value: counts.submitted + counts.underReview + counts.waitingForInfo + counts.resolved + counts.closed, color: "text-[#0F172A]" },
    { label: "Under Review", value: counts.underReview + counts.submitted, color: "text-amber-600" },
    { label: "Waiting for Info", value: counts.waitingForInfo, color: "text-orange-600" },
    { label: "Resolved", value: counts.resolved, color: "text-emerald-600" },
    { label: "Closed", value: counts.closed, color: "text-slate-400" },
  ] : [];

  return (
    <main className="flex-1 bg-[#F8FAFC]">
      <div className="flex h-[68px] items-center border-b border-slate-200 bg-white px-4 sm:px-8">
        <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A]">Support Tickets</h1>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets…" className="h-10 w-[220px] rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#2563EB]" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            {["All", "SUBMITTED", "UNDER_REVIEW", "WAITING_FOR_INFO", "RESOLVED", "CLOSED"].map((v) => <option key={v} value={v}>{v === "All" ? "Status: All" : v.replaceAll("_", " ")}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            {["All", "Normal", "High", "Urgent"].map((v) => <option key={v}>{v === "All" ? "Priority: All" : v}</option>)}
          </select>
          <Link href="/support/tickets/new" className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-[#1434A4] px-4 text-sm font-bold text-white transition hover:brightness-110">+ New Ticket</Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-[12px] font-semibold text-slate-500">
                <tr>{["Ticket ID", "Subject", "Category", "Priority", "Status", "Created", "Last Updated", "Assigned To"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.reference} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3.5"><Link href={`/support/tickets/${t.reference}`} className="font-bold text-[#2563EB]">{t.reference}</Link></td>
                    <td className="px-4 py-3.5 font-semibold text-[#0F172A]">{t.subject}</td>
                    <td className="px-4 py-3.5 text-slate-600">{t.categoryLabel}</td>
                    <td className="px-4 py-3.5"><PriorityText priority={t.priority} /></td>
                    <td className="px-4 py-3.5"><StatusPill status={t.status} /></td>
                    <td className="px-4 py-3.5 text-slate-600">{fmtDate(t.createdAt)}</td>
                    <td className="px-4 py-3.5 text-slate-600">{fmtDate(t.lastActivityAt, true)}</td>
                    <td className="px-4 py-3.5 font-semibold text-[#0F172A]">{t.assignedAgentName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-3 text-[13px] text-slate-500">
            {loading ? "Loading tickets…" : `Showing ${filtered.length} of ${tickets.length} tickets`}
          </div>
          {!loading && !tickets.length && (
            <p className="border-t border-slate-100 p-8 text-center text-sm text-slate-500">
              No support tickets yet. <Link href="/support/tickets/new" className="font-semibold text-[#2563EB]">Submit your first ticket</Link>.
            </p>
          )}
        </div>

        {counts && (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {tiles.map((tile) => (
              <div key={tile.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4">
                <span className="text-[13px] font-medium text-slate-600">{tile.label}</span>
                <b className={`text-[18px] ${tile.color}`}>{tile.value}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
