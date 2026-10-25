"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Button } from "@/components/ui/button";
import { BUSINESS_TICKET_CATEGORIES, Crumbs, SUBCATEGORIES } from "@/components/support/support-ui";

const PRIORITIES = [
  { value: "NORMAL", label: "Normal", active: "border-slate-300 bg-slate-50 text-slate-700" },
  { value: "HIGH", label: "High", active: "border-amber-400 bg-amber-50 text-amber-700" },
  { value: "URGENT", label: "Urgent", active: "border-red-400 bg-red-50 text-red-600" },
] as const;

const field = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100";

export default function NewTicketPage() {
  const router = useRouter();
  const { business } = useDashboard() as { business: { id: string } | null };
  const [form, setForm] = useState({ category: "API_DEVELOPERS", subcategory: "", priority: "NORMAL" as "NORMAL" | "HIGH" | "URGENT", subject: "", description: "", reference: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const subcats = useMemo(() => SUBCATEGORIES[form.category] ?? ["Other"], [form.category]);

  async function submit() {
    setBusy(true); setError("");
    try {
      const res = await businessApi.createTicket({
        category: form.category,
        subcategory: form.subcategory || undefined,
        priority: form.priority,
        subject: form.subject.trim(),
        description: form.description.trim(),
        transactionReference: form.reference.trim() || undefined,
        businessId: business?.id,
      });
      router.replace(`/support/tickets/${res.data.reference}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the ticket");
      setBusy(false);
    }
  }

  const valid = form.subject.trim().length >= 5 && form.description.trim().length >= 20;

  return (
    <main className="flex-1 bg-[#F8FAFC]">
      <div className="flex h-[68px] items-center border-b border-slate-200 bg-white px-4 sm:px-8">
        <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A]">Submit a Support Ticket</h1>
      </div>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-8">
        <Crumbs items={[{ label: "Support", href: "/support" }, { label: "Submit Ticket" }]} />
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-[18px] font-bold text-[#0F172A]">Ticket Details</h2>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <label className="block text-sm font-semibold text-[#0F172A]">Category *
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: "" })} className={`mt-1.5 ${field}`}>
                  {BUSINESS_TICKET_CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#0F172A]">Sub-Category *
                <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className={`mt-1.5 ${field}`}>
                  <option value="">Select a sub-category</option>
                  {subcats.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Priority *</p>
                <div className="mt-1.5 grid grid-cols-3 gap-3">
                  {PRIORITIES.map((p) => (
                    <button key={p.value} type="button" onClick={() => setForm({ ...form, priority: p.value })}
                      className={`h-11 rounded-lg border text-sm font-bold transition ${form.priority === p.value ? p.active : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block text-sm font-semibold text-[#0F172A]">Subject *
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={150} placeholder="Webhook events not firing for payment.completed" className={`mt-1.5 ${field}`} />
              </label>
            </div>
            <div className="space-y-5">
              <label className="block text-sm font-semibold text-[#0F172A]">Description *
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={6} maxLength={5000}
                  placeholder="Describe what happened, what you expected, and any error messages. Minimum 20 characters."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 p-3.5 text-sm leading-6 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="block text-sm font-semibold text-[#0F172A]">Related Reference <span className="font-normal text-slate-400">(optional)</span>
                <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} maxLength={80} placeholder="Webhook ID: WHK-2025-0034" className={`mt-1.5 ${field}`} />
              </label>
            </div>
          </div>
          {error && <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="flex items-center gap-2 text-[13px] text-slate-500">
              <svg className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4.4l2.6 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              High priority tickets are responded to within 4 hours during business hours.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
              <Button onClick={submit} loading={busy} disabled={!valid} className="bg-[#1434A4]">Submit Ticket</Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
