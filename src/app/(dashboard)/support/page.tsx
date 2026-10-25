"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCentre, businessApi } from "@/lib/api";

const CATEGORY_LINK = (slug: string) => `/support?category=${slug}`;

export default function SupportHubPage() {
  const router = useRouter();
  const [hub, setHub] = useState<HelpCentre | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ slug: string; title: string; categoryName: string }> | null>(null);

  useEffect(() => {
    businessApi.helpCentre().then((r) => setHub(r.data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults(null); return; }
    const t = setTimeout(() => {
      businessApi.searchHelp(query.trim()).then((r) => setResults(r.data.results)).catch(() => undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <main className="flex-1 bg-[#F8FAFC]">
      <div className="flex h-[68px] items-center border-b border-slate-200 bg-white px-4 sm:px-8">
        <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A]">Help &amp; Support</h1>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8">
        {/* Hero search */}
        <section className="relative overflow-hidden rounded-2xl bg-[#0F172A] p-8">
          <h2 className="text-[22px] font-bold text-white">How can we help your business?</h2>
          <div className="relative mt-4">
            <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tutorials, guides, troubleshooting articles…" className="h-[52px] w-full rounded-xl bg-white pl-12 pr-4 text-sm outline-none" />
            {results && (
              <div className="absolute inset-x-0 top-[58px] z-20 max-h-72 overflow-y-auto rounded-xl bg-white p-2 shadow-xl">
                {results.map((r) => (
                  <button key={r.slug} onClick={() => router.push(`/support?article=${r.slug}`)} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50">
                    <b className="block text-sm text-[#0F172A]">{r.title}</b>
                    <span className="text-xs text-slate-500">{r.categoryName}</span>
                  </button>
                ))}
                {!results.length && <p className="px-3 py-2 text-sm text-slate-500">No articles match that search.</p>}
              </div>
            )}
          </div>
        </section>

        {/* Action cards */}
        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <Link href="/support/chat" className="rounded-2xl bg-[#1434A4] p-5 text-white transition hover:brightness-110">
            <div className="flex items-start justify-between">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3c-1.4 0-2.8-.3-4-1L3 20l1.3-4.4A8 8 0 0 1 3.5 11.5 8.4 8.4 0 0 1 12 3.2a8.4 8.4 0 0 1 9 8.3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${hub?.supportHours.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-white/20 text-white"}`}>{hub?.supportHours.isOpen ? "AVAILABLE" : "OFFLINE"}</span>
            </div>
            <b className="mt-4 block text-[16px]">Live Chat</b>
            <span className="text-[13px] text-white/70">Chat with our team</span>
          </Link>
          <Link href="/support/tickets/new" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300">
            <div className="flex items-start justify-between">
              <svg className="h-6 w-6 text-[#2563EB]" viewBox="0 0 24 24" fill="none"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">24/7 RESPONSE</span>
            </div>
            <b className="mt-4 block text-[16px] text-[#0F172A]">Submit Ticket</b>
            <span className="text-[13px] text-slate-500">Create a support request</span>
          </Link>
          <Link href="/support/tickets" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300">
            <div className="flex items-start justify-between">
              <svg className="h-6 w-6 text-[#2563EB]" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">TRACK PROGRESS</span>
            </div>
            <b className="mt-4 block text-[16px] text-[#0F172A]">My Tickets</b>
            <span className="text-[13px] text-slate-500">{hub ? `${hub.openTicketCount} open ticket${hub.openTicketCount === 1 ? "" : "s"}` : "View your requests"}</span>
          </Link>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="self-start rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-[16px] font-bold text-[#0F172A]">Popular Business Articles</h3>
            <div className="mt-3 space-y-2.5">
              {(hub?.popular ?? []).map((a) => (
                <Link key={a.slug} href={`/support?article=${a.slug}`} className="flex items-center gap-2.5 text-sm font-semibold text-[#2563EB] hover:underline">
                  <svg className="h-4 w-4 shrink-0 text-[#2563EB]" viewBox="0 0 20 20" fill="none"><path d="M6 2.5h5.5L16 7v9.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                  {a.title}
                </Link>
              ))}
              {hub && !hub.popular.length && <p className="text-sm text-slate-500">Articles are being written — check back soon, or search above.</p>}
            </div>
          </div>
          <div className="self-start rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-[16px] font-bold text-[#0F172A]">Browse Categories</h3>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {(hub?.categories ?? []).map((c) => (
                <Link key={c.slug} href={CATEGORY_LINK(c.slug)} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-[#0F172A] transition hover:bg-slate-100">
                  <svg className="h-4 w-4 shrink-0 text-slate-500" viewBox="0 0 20 20" fill="none"><path d="M2.5 5.5a1 1 0 0 1 1-1h4l1.5 2h7.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
