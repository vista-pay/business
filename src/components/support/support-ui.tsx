"use client";
import Link from "next/link";

export const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  WAITING_FOR_INFO: "bg-orange-50 text-orange-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-500",
};
export const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  WAITING_FOR_INFO: "Waiting for Info",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
export function PriorityText({ priority }: { priority: string }) {
  const color = priority === "URGENT" ? "text-red-600" : priority === "HIGH" ? "text-amber-600" : "text-slate-600";
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return <span className={`text-sm font-semibold ${color}`}>{label}</span>;
}

export function Crumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="flex items-center gap-2 text-[13px]">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-slate-300">›</span>}
          {item.href ? (
            <Link href={item.href} className="text-slate-400 hover:text-slate-600">{item.label}</Link>
          ) : (
            <span className="font-semibold text-[#0F172A]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** The submit form's sub-category options, keyed by ticket category code. */
export const SUBCATEGORIES: Record<string, string[]> = {
  API_DEVELOPERS: ["Webhook Configuration", "API Keys", "SDK Integration", "Rate Limits", "Sandbox & Testing", "Other"],
  SETTLEMENTS: ["Settlement Delay", "Settlement Account", "Reconciliation", "Other"],
  INVOICES: ["Invoice Creation", "Invoice Payment", "PDF & Formatting", "Other"],
  PAYMENT_LINKS: ["Link Setup", "Currency & Amounts", "Link Sharing", "Other"],
  TEAM_MANAGEMENT: ["Invitations", "Roles & Permissions", "Access Issues", "Other"],
  TRANSFER_PAYMENT: ["Pending Transfer", "Failed Payment", "Refunds", "Other"],
  WALLET_BALANCE: ["Balance Mismatch", "Funding", "Other"],
  SECURITY: ["Suspicious Activity", "Account Access", "Other"],
  ACCOUNT_PROFILE: ["Business Profile", "Verification", "Other"],
  OTHER: ["Other"],
};

/** Categories the business console offers when raising a ticket. */
export const BUSINESS_TICKET_CATEGORIES = [
  { code: "API_DEVELOPERS", label: "API & Developers" },
  { code: "SETTLEMENTS", label: "Settlements" },
  { code: "INVOICES", label: "Invoices" },
  { code: "PAYMENT_LINKS", label: "Payment Links" },
  { code: "TEAM_MANAGEMENT", label: "Team Management" },
  { code: "TRANSFER_PAYMENT", label: "Transfer & Payment" },
  { code: "WALLET_BALANCE", label: "Wallet & Balance" },
  { code: "SECURITY", label: "Security" },
  { code: "ACCOUNT_PROFILE", label: "Account & Profile" },
  { code: "OTHER", label: "Other" },
];

export function fmtDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(new Date(value));
}
