export function cn(...classes: (string | boolean | undefined | null)[]) { return classes.filter(Boolean).join(" "); }
export function formatCurrency(amount: string | number, currency = "NGN") {
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(num)) return `${currency} 0.00`;
  try { return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(num); } catch { return `${currency} ${num.toLocaleString()}`; }
}
export function formatDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
