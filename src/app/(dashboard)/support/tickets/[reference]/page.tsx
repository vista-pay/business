"use client";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SupportTicketDetail, businessApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Crumbs, StatusPill, fmtDate } from "@/components/support/support-ui";

export default function TicketDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setTicket((await businessApi.getTicket(reference)).data); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load the ticket"); }
  }, [reference]);
  useEffect(() => { void load(); }, [load]);

  async function sendReply() {
    if (reply.trim().length < 1) return;
    setBusy(true);
    try { setTicket((await businessApi.replyTicket(reference, { body: reply.trim() })).data); setReply(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send the reply"); }
    finally { setBusy(false); }
  }
  async function act(action: "close" | "escalate") {
    setBusy(true);
    try {
      const res = action === "close" ? await businessApi.closeTicket(reference) : await businessApi.escalateTicket(reference);
      setTicket(res.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Action failed"); }
    finally { setBusy(false); }
  }

  if (!ticket) {
    return <main className="flex flex-1 items-center justify-center bg-[#F8FAFC] p-10 text-sm text-slate-500">{error || "Loading ticket…"}</main>;
  }

  const profileRows: Array<[string, React.ReactNode]> = [
    ["Ticket ID", <b key="r">{ticket.reference}</b>],
    ["Category", ticket.categoryLabel],
    ...(ticket.subcategory ? ([["Sub-category", ticket.subcategory]] as Array<[string, React.ReactNode]>) : []),
    ["Priority", ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase()],
    ["Status", ticket.status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())],
    ["Created On", fmtDate(ticket.createdAt, true)],
    ["Last Updated", fmtDate(ticket.lastActivityAt, true)],
    ...(ticket.assignedAgentName ? ([["Assigned To", ticket.assignedAgentName]] as Array<[string, React.ReactNode]>) : []),
  ];

  return (
    <main className="flex-1 bg-[#F8FAFC]">
      <div className="flex h-[68px] items-center border-b border-slate-200 bg-white px-4 sm:px-8">
        <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A]">Ticket Details</h1>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8">
        <Crumbs items={[{ label: "Support", href: "/support" }, { label: "Tickets", href: "/support/tickets" }, { label: ticket.reference }]} />
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[19px] font-bold text-[#0F172A]">{ticket.reference}: {ticket.subject}</h2>
              <StatusPill status={ticket.status} />
              {ticket.priority !== "NORMAL" && (
                <span className={`rounded-md px-2 py-1 text-[11px] font-bold uppercase ${ticket.priority === "URGENT" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                  {ticket.priority} PRIORITY
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-600">
              <span>Category: <b className="text-[#0F172A]">{ticket.categoryLabel}</b></span>
              <span>Created: <b className="text-[#0F172A]">{fmtDate(ticket.createdAt, true)}</b></span>
              {ticket.assignedAgentName && <span>Assigned: <b className="text-[#0F172A]">{ticket.assignedAgentName}</b></span>}
            </div>

            <div className="mt-4 space-y-3">
              {ticket.messages.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <b className={`text-sm ${m.authorType === "AGENT" ? "text-[#2563EB]" : "text-[#0F172A]"}`}>
                      {m.authorType === "AGENT" ? `${m.authorName} (Support Agent)` : `${m.authorName} (Client)`}
                    </b>
                    <span className="shrink-0 text-xs text-slate-400">{fmtDate(m.createdAt, true)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{m.body}</p>
                  {m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((a) => (
                        <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                          📄 {a.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {ticket.canReply ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Write your reply here…" className="w-full resize-none text-sm leading-6 outline-none" />
                <div className="mt-2 flex items-center justify-end border-t border-slate-100 pt-3">
                  <Button onClick={sendReply} loading={busy} disabled={!reply.trim()} className="bg-[#1434A4]">Send Reply</Button>
                </div>
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-500">This ticket is closed. Submit a new ticket if you still need help.</p>
            )}
          </div>

          <aside className="space-y-4 self-start">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Ticket Profile</h3>
              <dl className="mt-3 space-y-2 text-[13px]">
                {profileRows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold text-[#0F172A]">{v}</dd></div>
                ))}
              </dl>
            </div>
            {ticket.transactionReference && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-[15px] font-bold text-[#0F172A]">Related Reference</h3>
                <button onClick={() => navigator.clipboard?.writeText(ticket.transactionReference!)} className="mt-3 flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-bold text-[#0F172A]">
                  {ticket.transactionReference} <span className="text-[#2563EB]">⧉</span>
                </button>
              </div>
            )}
            {ticket.status !== "CLOSED" && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-[15px] font-bold text-[#0F172A]">Resolutions</h3>
                <div className="mt-3 space-y-2">
                  <button onClick={() => act("close")} disabled={busy} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold text-[#0F172A] transition hover:bg-slate-100 disabled:opacity-50">Mark as Closed</button>
                  <button onClick={() => act("escalate")} disabled={busy || ticket.priority === "URGENT"} className="h-10 w-full rounded-lg border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                    {ticket.priority === "URGENT" ? "Escalated" : "Escalate Ticket"}
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
