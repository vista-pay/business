// Filtering, labelling and export for the Payments list (Figma 41:1730).
import { Transaction, counterparty, typeLabel } from "./dashboard-data";

/** How the money arrived, as the design labels it. */
const METHOD_LABELS: Record<string, string> = {
  DEPOSIT: "Bank Transfer",
  PAYMENT_LINK: "Payment Link",
  INVOICE_PAYMENT: "Invoice",
  TRANSFER: "Transfer",
  INTERNATIONAL_TRANSFER: "Int'l Transfer",
  WITHDRAWAL: "Payout",
  BILL_PAYMENT: "Bill Payment",
  FX_CONVERSION: "Conversion",
};

export function methodLabel(type: string) {
  return METHOD_LABELS[type] ?? typeLabel(type);
}

export const STATUS_FILTERS = ["All", "Success", "Pending", "Failed"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const TIME_FILTERS = ["All Time", "Today", "Last 7 days", "Last 30 days", "Last 90 days"] as const;
export type TimeFilter = (typeof TIME_FILTERS)[number];

const PENDING = new Set(["INITIATED", "PENDING", "PROCESSING"]);
const FAILED = new Set(["FAILED", "CANCELLED", "REVERSED"]);

function matchesStatus(status: string, filter: StatusFilter) {
  if (filter === "All") return true;
  if (filter === "Success") return status === "SUCCESS";
  if (filter === "Pending") return PENDING.has(status);
  return FAILED.has(status);
}

function matchesTime(createdAt: string, filter: TimeFilter, now: Date) {
  if (filter === "All Time") return true;
  const date = new Date(createdAt);
  if (filter === "Today") return date.toDateString() === now.toDateString();
  const days = filter === "Last 7 days" ? 7 : filter === "Last 30 days" ? 30 : 90;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

export type PaymentFilters = {
  search: string;
  status: StatusFilter;
  currency: string;
  time: TimeFilter;
};

export function filterPayments(transactions: Transaction[], filters: PaymentFilters, now = new Date()) {
  const needle = filters.search.trim().toLowerCase();
  return transactions.filter((t) => {
    if (!matchesStatus(t.status, filters.status)) return false;
    if (filters.currency !== "All" && t.currency !== filters.currency) return false;
    if (!matchesTime(t.createdAt, filters.time, now)) return false;
    if (!needle) return true;
    return (
      counterparty(t).toLowerCase().includes(needle) ||
      t.reference.toLowerCase().includes(needle) ||
      methodLabel(t.type).toLowerCase().includes(needle)
    );
  });
}

/** Currencies actually present, so the filter never offers an empty tab. */
export function currenciesIn(transactions: Transaction[]) {
  return ["All", ...Array.from(new Set(transactions.map((t) => t.currency))).sort()];
}

export function toCsv(transactions: Transaction[]) {
  const header = ["Date", "Customer", "Reference", "Amount", "Currency", "Method", "Status"];
  const rows = transactions.map((t) => [
    new Date(t.createdAt).toISOString(),
    counterparty(t),
    t.reference,
    t.amount,
    t.currency,
    methodLabel(t.type),
    t.status,
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
