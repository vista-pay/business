// Reports & statement logs (Figma 44:404 / 44:564).
import { Transaction, isCredit } from "./dashboard-data";

export const RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"] as const;
export type Range = (typeof RANGES)[number];

export function rangeStart(range: Range, now = new Date()) {
  const start = new Date(now);
  if (range === "This Year") return new Date(now.getFullYear(), 0, 1);
  const days = range === "Last 7 Days" ? 7 : range === "Last 30 Days" ? 30 : 90;
  start.setDate(start.getDate() - days);
  return start;
}

const NEUTRAL = new Set(["FX_CONVERSION", "ADJUSTMENT"]);

function settled(transactions: Transaction[]) {
  return transactions.filter((t) => t.status === "SUCCESS" && !NEUTRAL.has(t.type));
}

/**
 * Headline figures for one currency. Mixing currencies into a single "total
 * inflow" would be meaningless, so the page reports one currency at a time.
 */
export function summarise(transactions: Transaction[], currency: string, range: Range, now = new Date()) {
  const start = rangeStart(range, now);
  const previousStart = new Date(start.getTime() - (now.getTime() - start.getTime()));

  const inRange = (from: Date, to: Date) =>
    settled(transactions).filter((t) => {
      if (t.currency !== currency) return false;
      const at = new Date(t.createdAt);
      return at >= from && at < to;
    });

  const current = inRange(start, now);
  const previous = inRange(previousStart, start);

  const sum = (list: Transaction[], credit: boolean) =>
    list.filter((t) => isCredit(t.type) === credit).reduce((total, t) => total + (Number(t.amount) || 0), 0);

  const inflow = sum(current, true);
  const outflow = sum(current, false);
  const prevInflow = sum(previous, true);
  const prevOutflow = sum(previous, false);

  const change = (nowValue: number, before: number) => (before === 0 ? null : ((nowValue - before) / before) * 100);

  return {
    inflow,
    outflow,
    net: inflow - outflow,
    count: current.length,
    inflowChange: change(inflow, prevInflow),
    outflowChange: change(outflow, prevOutflow),
    netChange: change(inflow - outflow, prevInflow - prevOutflow),
    countChange: change(current.length, previous.length),
    transactions: current,
  };
}

export type TrendPoint = { label: string; inflow: number; outflow: number };

/** Daily buckets across the range, for the cash-flow chart. */
export function cashFlowTrend(transactions: Transaction[], currency: string, range: Range, now = new Date()): TrendPoint[] {
  const start = rangeStart(range, now);
  const days = Math.max(1, Math.round((now.getTime() - start.getTime()) / 86_400_000));
  const buckets = Math.min(days, 12);
  const span = (now.getTime() - start.getTime()) / buckets;

  const points: TrendPoint[] = [];
  for (let i = 0; i < buckets; i += 1) {
    const from = new Date(start.getTime() + span * i);
    const to = new Date(start.getTime() + span * (i + 1));
    const slice = settled(transactions).filter((t) => {
      if (t.currency !== currency) return false;
      const at = new Date(t.createdAt);
      return at >= from && at < to;
    });
    points.push({
      label: from.toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
      inflow: slice.filter((t) => isCredit(t.type)).reduce((s, t) => s + (Number(t.amount) || 0), 0),
      outflow: slice.filter((t) => !isCredit(t.type)).reduce((s, t) => s + (Number(t.amount) || 0), 0),
    });
  }
  return points;
}

const CATEGORY_BY_TYPE: Record<string, string> = {
  WITHDRAWAL: "Payouts",
  TRANSFER: "Transfers",
  INTERNATIONAL_TRANSFER: "International",
  BILL_PAYMENT: "Bills & utilities",
  FEE: "Fees",
  SUBSCRIPTION: "Subscriptions",
  AJO_CONTRIBUTION: "Contributions",
  LOAN_REPAYMENT: "Loan repayments",
};

export type CategorySlice = { label: string; amount: number; share: number };

/** Outgoing money grouped by what it was spent on. */
export function spendingByCategory(transactions: Transaction[], currency: string): CategorySlice[] {
  const spend = settled(transactions).filter((t) => t.currency === currency && !isCredit(t.type));
  const totals = new Map<string, number>();
  for (const t of spend) {
    const label = CATEGORY_BY_TYPE[t.type] ?? "Other";
    totals.set(label, (totals.get(label) ?? 0) + (Number(t.amount) || 0));
  }
  const total = Array.from(totals.values()).reduce((s, v) => s + v, 0);
  if (total === 0) return [];
  return Array.from(totals.entries())
    .map(([label, amount]) => ({ label, amount, share: (amount / total) * 100 }))
    .sort((a, b) => b.amount - a.amount);
}

export const CATEGORY_COLOURS = ["#2563EB", "#F59E0B", "#16A34A", "#475569", "#94A3B8", "#7C3AED", "#DC2626"];

/** Calendar periods the business can pull a statement for. */
export function statementPeriods(now = new Date()) {
  const periods: Array<{ label: string; from: Date; to: Date; type: string }> = [];
  for (let i = 0; i < 3; i += 1) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    periods.push({
      label: from.toLocaleDateString("en-NG", { month: "short", year: "numeric" }),
      from,
      to,
      type: "Monthly Statement",
    });
  }
  const quarter = Math.floor(now.getMonth() / 3);
  const qFrom = new Date(now.getFullYear(), quarter * 3, 1);
  periods.push({
    label: `Q${quarter + 1} ${now.getFullYear()}`,
    from: qFrom,
    to: new Date(now.getFullYear(), quarter * 3 + 3, 1),
    type: "Quarterly Report",
  });
  return periods;
}
