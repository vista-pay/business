// Shaping for the business dashboard (Figma 41:667). Figures are scoped to the
// active business via `GET /transactions?businessId=`.

export type Transaction = {
  id: string;
  reference: string;
  type: string;
  amount: string;
  /** Provider/platform fee, as returned by the list endpoint. */
  fee?: string;
  /** Ledger balance after this entry; only present for wallet-scoped queries. */
  balanceAfter?: string | null;
  netAmount?: string;
  currency: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: string;
  currencyCode: string;
  status: string;
  dueDate: string;
};

/** Transaction types that move money into the account. */
const CREDIT_TYPES = new Set([
  "DEPOSIT",
  "PAYMENT_LINK",
  "INVOICE_PAYMENT",
  "AJO_PAYOUT",
  "LOAN_DISBURSEMENT",
  "REVERSAL",
]);

/** Neither a receipt nor a payment - excluded from the daily totals. */
const NEUTRAL_TYPES = new Set(["FX_CONVERSION", "ADJUSTMENT"]);

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Payment",
  WITHDRAWAL: "Withdrawal",
  TRANSFER: "Transfer",
  INTERNATIONAL_TRANSFER: "Int'l Transfer",
  PAYMENT_LINK: "Payment Link",
  INVOICE_PAYMENT: "Invoice",
  FX_CONVERSION: "Conversion",
  FEE: "Fee",
  REVERSAL: "Reversal",
  ADJUSTMENT: "Adjustment",
  BILL_PAYMENT: "Bill Payment",
  SUBSCRIPTION: "Subscription",
};

const PENDING_STATUSES = new Set(["INITIATED", "PENDING", "PROCESSING"]);
const OUTSTANDING_INVOICE_STATUSES = new Set(["SENT", "OVERDUE", "DRAFT"]);

export function isCredit(type: string) {
  return CREDIT_TYPES.has(type);
}

export function typeLabel(type: string) {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

export function statusLabel(status: string) {
  if (status === "SUCCESS") return "Success";
  if (status === "PROCESSING") return "Processing";
  if (PENDING_STATUSES.has(status)) return "Pending";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/**
 * Totals must never be added across currencies - NGN 450,000 plus USD 2,500 is
 * not 452,500 of anything. Returns one total per currency present.
 */
export function totalsByCurrency(transactions: Transaction[]) {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    totals.set(t.currency, (totals.get(t.currency) ?? 0) + (Number(t.amount) || 0));
  }
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([currency, amount]) => ({ currency, amount }));
}

/** The design labels each row with a counterparty; derive one where we can. */
export function counterparty(t: Transaction) {
  const meta = (t.metadata ?? {}) as Record<string, unknown>;
  for (const key of ["recipientName", "senderName", "customerName", "beneficiaryName", "merchantName", "narration", "description"]) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return t.reference;
}

export function money(amount: string | number, currency = "NGN") {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return `${currency} 0.00`;
  return `${currency} ${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function signedMoney(t: Transaction) {
  const n = Number(t.amount);
  const credit = isCredit(t.type);
  const formatted = Number.isFinite(n)
    ? n.toLocaleString("en-NG", { maximumFractionDigits: 2 })
    : "0";
  return `${credit ? "+" : "-"}${t.currency} ${formatted}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function sumOn(transactions: Transaction[], day: Date, credit: boolean) {
  return transactions
    .filter((t) => t.status === "SUCCESS" && !NEUTRAL_TYPES.has(t.type) && isCredit(t.type) === credit)
    .filter((t) => sameDay(new Date(t.createdAt), day))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

/** Percentage change against the same figure yesterday; null when there is no base. */
function delta(today: number, yesterday: number) {
  if (yesterday === 0) return null;
  return ((today - yesterday) / yesterday) * 100;
}

export function activitySummary(transactions: Transaction[], now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const receivedToday = sumOn(transactions, now, true);
  const paidToday = sumOn(transactions, now, false);
  const pendingSettlements = transactions
    .filter((t) => PENDING_STATUSES.has(t.status))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return {
    receivedToday,
    paidToday,
    pendingSettlements,
    receivedDelta: delta(receivedToday, sumOn(transactions, yesterday, true)),
    paidDelta: delta(paidToday, sumOn(transactions, yesterday, false)),
  };
}

export function outstandingInvoices(invoices: Invoice[]) {
  const items = invoices.filter((i) => OUTSTANDING_INVOICE_STATUSES.has(i.status));
  const total = items.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  return { items, total, currency: items[0]?.currencyCode ?? "NGN" };
}
