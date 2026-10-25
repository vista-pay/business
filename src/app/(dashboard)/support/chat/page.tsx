"use client";
import Link from "next/link";
import { Crumbs } from "@/components/support/support-ui";

export default function SupportChatPage() {
  return (
    <main className="flex-1 bg-[#F8FAFC]">
      <div className="flex h-[68px] items-center border-b border-slate-200 bg-white px-4 sm:px-8">
        <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A]">Business Support Chat</h1>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8">
        <Crumbs items={[{ label: "Support", href: "/support" }, { label: "Live Chat" }]} />
        <section className="mt-4 flex min-h-[480px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3c-1.4 0-2.8-.3-4-1L3 20l1.3-4.4A8 8 0 0 1 3.5 11.5 8.4 8.4 0 0 1 12 3.2a8.4 8.4 0 0 1 9 8.3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="mt-5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Offline</span>
          <h2 className="mt-4 text-[20px] font-bold text-[#0F172A]">Live chat is currently offline</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Kindly submit a ticket and our team will take it from there. You&rsquo;ll get a reference to track
            the conversation, and we&rsquo;ll respond as quickly as we can. Thank you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/support/tickets/new" className="flex h-11 items-center rounded-lg bg-[#1434A4] px-5 text-sm font-bold text-white transition hover:brightness-110">
              Submit a Ticket
            </Link>
            <Link href="/support/tickets" className="flex h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-[#0F172A] transition hover:bg-slate-50">
              View My Tickets
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
