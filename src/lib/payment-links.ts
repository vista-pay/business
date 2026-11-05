// Payment links (Figma 41:2911 / 41:3035 / 41:3145) and invoices (41:3294 /
// 41:3421).

export type PaymentLink = {
  id: string;
  linkHash: string;
  title: string;
  description?: string | null;
  amount?: string | null;
  currencyCode: string;
  isFixedAmount: boolean;
  isActive: boolean;
  maxUses?: number | null;
  currentUses: number;
  pendingUses?: number;
  expiresAt?: string | null;
  createdAt: string;
};

export const LINK_FILTERS = ["All", "Active", "Expired", "Disabled", "Paid"] as const;
export type LinkFilter = (typeof LINK_FILTERS)[number];

export function linkStatus(link: PaymentLink): "Active" | "Expired" | "Disabled" | "Paid" {
  if (!link.isActive) return "Disabled";
  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) return "Expired";
  if (link.maxUses && link.currentUses >= link.maxUses) return "Paid";
  return "Active";
}

export function filterLinks(links: PaymentLink[], filter: LinkFilter, search: string) {
  const needle = search.trim().toLowerCase();
  return links.filter((link) => {
    if (filter !== "All" && linkStatus(link) !== filter) return false;
    if (!needle) return true;
    return link.title.toLowerCase().includes(needle) || link.linkHash.toLowerCase().includes(needle);
  });
}

export function publicUrl(linkHash: string) {
  const base = (process.env.NEXT_PUBLIC_PAYMENT_BASE_URL ?? "https://pay.rendi.ng").replace(/\/+$/, "");
  return `${base}/${linkHash}`;
}

export function expiryNote(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const formatted = date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  if (days < 0) return { formatted, remaining: "expired", expired: true };
  return { formatted, remaining: `${days} day${days === 1 ? "" : "s"} remaining`, expired: false };
}

export const EXPIRY_OPTIONS = ["No expiry", "7 days", "14 days", "30 days", "60 days", "90 days"] as const;
export type ExpiryOption = (typeof EXPIRY_OPTIONS)[number];

export function expiryToIso(option: ExpiryOption) {
  if (option === "No expiry") return undefined;
  const days = Number(option.split(" ")[0]);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

// ---- Invoices -------------------------------------------------------------

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  totalAmount: string;
  currencyCode: string;
  status: string;
  dueDate: string;
  createdAt?: string;
  paidAt?: string | null;
};

/** `Invoice.status` has no VIEWED value; the tab is kept for design parity. */
export const INVOICE_FILTERS = ["All", "Draft", "Sent", "Viewed", "Paid", "Overdue", "Cancelled"] as const;
export type InvoiceFilter = (typeof INVOICE_FILTERS)[number];

export function filterInvoices(invoices: Invoice[], filter: InvoiceFilter, search: string) {
  const needle = search.trim().toLowerCase();
  return invoices.filter((invoice) => {
    if (filter !== "All" && invoice.status.toUpperCase() !== filter.toUpperCase()) return false;
    if (!needle) return true;
    return (
      invoice.invoiceNumber.toLowerCase().includes(needle) || invoice.customerName.toLowerCase().includes(needle)
    );
  });
}

const OUTSTANDING = new Set(["DRAFT", "SENT", "OVERDUE"]);

/** Headline figures, kept per currency so nothing is summed across them. */
export function invoiceTotals(invoices: Invoice[], now = new Date()) {
  const sum = (list: Invoice[]) => {
    const totals = new Map<string, number>();
    for (const i of list) totals.set(i.currencyCode, (totals.get(i.currencyCode) ?? 0) + (Number(i.totalAmount) || 0));
    return Array.from(totals.entries()).map(([currency, amount]) => ({ currency, amount }));
  };

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    outstanding: sum(invoices.filter((i) => OUTSTANDING.has(i.status.toUpperCase()))),
    overdue: sum(invoices.filter((i) => i.status.toUpperCase() === "OVERDUE")),
    paidThisMonth: sum(
      invoices.filter((i) => i.status.toUpperCase() === "PAID" && i.paidAt && new Date(i.paidAt) >= monthStart)
    ),
  };
}

export type InvoiceLine = { id: string; description: string; quantity: string; unitPrice: string };

export function lineTotal(line: InvoiceLine) {
  return (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
}

export function invoiceSubtotal(lines: InvoiceLine[]) {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}
