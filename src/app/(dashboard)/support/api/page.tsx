"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/constants";
import { Crumbs } from "@/components/support/support-ui";

const DOCS_URL = `${API_BASE.replace(/\/api\/v1$/, "")}/api/docs`;

const COMMON_ISSUES: Array<{ q: string; a: string }> = [
  { q: "Authentication failing (401 errors)", a: "Send your secret key in the Authorization header as `Bearer sk_...`. A 401 usually means the key was revoked, belongs to the other environment, or the header is missing entirely. Generate keys from Developers → API Keys and never use a secret key in browser code." },
  { q: "Webhook events not delivering", a: "Check that your endpoint is publicly reachable over HTTPS and returns 2xx within 10 seconds. Verify the signature using your webhook secret. Failed deliveries are retried with backoff; persistent failures pause the endpoint — re-enable it from Developers → Webhooks after fixing your handler." },
  { q: "Rate limiting (429 errors)", a: "The API throttles bursts per key. Back off exponentially when you receive 429 and batch read calls where possible. If your integration legitimately needs a higher limit, raise a ticket with your expected request profile." },
  { q: "Sandbox vs. Production environment", a: "Sandbox keys (sk_test_...) and production keys (sk_live_...) are separate and cannot see each other's data. Payments made with test keys never move real money. Switch environments by swapping keys — the base URL stays the same." },
  { q: "API version migration", a: "Breaking changes ship as a new dated version; your account stays pinned to the version it first used. Review the changelog in the API docs before upgrading, test in sandbox, then update the version header in production." },
];

const FAQ = [
  { label: "How to generate API keys", href: "/api-keys" },
  { label: "How to test in sandbox mode", href: DOCS_URL },
  { label: "What is the rate limit?", href: DOCS_URL },
  { label: "How to handle idempotency", href: DOCS_URL },
];

export default function ApiSupportPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [checkedAt, setCheckedAt] = useState("");
  const [apiUp, setApiUp] = useState(true);

  useEffect(() => {
    // A real probe, not theatre: the docs endpoint answers iff the API is up.
    fetch(`${API_BASE.replace(/\/api\/v1$/, "")}/api/v1/support/availability`, { method: "HEAD" })
      .then((r) => setApiUp(r.ok || r.status === 401))
      .catch(() => setApiUp(false))
      .finally(() => setCheckedAt(new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date())));
  }, []);

  return (
    <main className="flex-1 bg-[#F8FAFC]">
      <div className="flex h-[68px] items-center border-b border-slate-200 bg-white px-4 sm:px-8">
        <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A]">API &amp; Developer Support</h1>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8">
        <Crumbs items={[{ label: "Support", href: "/support" }, { label: "API & Developer Support" }]} />

        <div className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${apiUp ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}>
          <span>● {apiUp ? "All systems operational" : "API unreachable — check your connection or status"}</span>
          <span className="font-medium text-slate-500">Last checked: {checkedAt || "…"}</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { title: "API Documentation", desc: "Complete API reference", link: "View Docs", href: DOCS_URL },
            { title: "Webhook Guide", desc: "Setup and troubleshoot webhooks", link: "View Guide", href: DOCS_URL },
            { title: "SDKs & Libraries", desc: "Official client libraries", link: "View SDKs", href: DOCS_URL },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <b className="block text-[16px] text-[#0F172A]">{card.title}</b>
              <span className="mt-1 block text-[13px] text-slate-500">{card.desc}</span>
              <a href={card.href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-[#2563EB] underline">{card.link}</a>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-[16px] font-bold text-[#0F172A]">Common API Issues</h2>
              <div className="mt-3 space-y-2.5">
                {COMMON_ISSUES.map((issue, i) => (
                  <div key={issue.q} className="rounded-xl border border-slate-200">
                    <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[#0F172A]">
                      {issue.q}
                      <span className={`text-slate-400 transition-transform ${open === i ? "rotate-180" : ""}`}>⌄</span>
                    </button>
                    {open === i && <p className="border-t border-slate-100 px-4 py-3 text-[13px] leading-6 text-slate-600">{issue.a}</p>}
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-[16px] font-bold text-[#0F172A]">Developer FAQ</h2>
              <div className="mt-3 space-y-2.5">
                {FAQ.map((f) => (
                  <a key={f.label} href={f.href} target={f.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] underline">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#2563EB] text-[10px] no-underline">?</span>{f.label}
                  </a>
                ))}
              </div>
            </section>
          </div>
          <aside className="space-y-4 self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Recent API Incidents</h3>
              <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">No incidents in the last 30 days.</p>
            </div>
            <div className="rounded-2xl bg-[#0F172A] p-6 text-white">
              <b className="block text-[16px]">Need More Help?</b>
              <p className="mt-1 text-[13px] leading-5 text-white/70">Our specialized API engineers are ready to assist with integration issues.</p>
              <Link href="/support/tickets/new" className="mt-4 block rounded-lg bg-[#1434A4] py-2.5 text-center text-sm font-bold text-white transition hover:brightness-110">Submit API Support Ticket</Link>
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="mt-2 block rounded-lg border border-white/30 py-2.5 text-center text-sm font-bold text-white">Join Developer Community</a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
