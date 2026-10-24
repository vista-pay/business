import { jsPDF } from "jspdf";
import { Transaction, counterparty, isCredit } from "./dashboard-data";
import { methodLabel } from "./payments";
import { walletMoney } from "./wallets";

export type ReportOptions = {
  businessName: string;
  title: string;
  from: Date;
  to: Date;
  currency: string;
  includeTransactions: boolean;
  includeFees: boolean;
};

function date(value: Date | string) {
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

/** Transaction ledger as a real PDF document. */
export function reportPdf(transactions: Transaction[], options: ReportOptions) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 40;
  const right = 555;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#0F172A");
  doc.text(options.businessName, left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor("#2563EB");
  doc.text(options.title, left, y + 18);

  doc.setFontSize(10);
  doc.setTextColor("#64748B");
  doc.text(`${date(options.from)} — ${date(options.to)}  ·  ${options.currency}`, left, y + 34);

  const inflow = transactions.filter((t) => t.status === "SUCCESS" && isCredit(t.type)).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const outflow = transactions.filter((t) => t.status === "SUCCESS" && !isCredit(t.type)).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const fees = transactions.reduce((s, t) => s + (Number(t.fee) || 0), 0);

  y += 62;
  doc.setDrawColor("#E2E8F0");
  doc.line(left, y - 12, right, y - 12);
  doc.setFontSize(10);
  doc.setTextColor("#64748B");
  doc.text("Total inflow", left, y + 8);
  doc.text("Total outflow", left + 170, y + 8);
  doc.text("Net position", left + 340, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor("#16A34A");
  doc.text(walletMoney(inflow, options.currency), left, y + 26);
  doc.setTextColor("#DC2626");
  doc.text(walletMoney(outflow, options.currency), left + 170, y + 26);
  doc.setTextColor("#0F172A");
  doc.text(walletMoney(inflow - outflow, options.currency), left + 340, y + 26);

  y += 50;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#64748B");
  doc.text(`${transactions.length} transactions`, left, y);
  if (options.includeFees) doc.text(`Fees charged: ${walletMoney(fees, options.currency)}`, left + 170, y);

  if (options.includeTransactions) {
    y += 28;
    doc.setFillColor("#F8FAFC");
    doc.rect(left, y - 13, right - left, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#475569");
    doc.text("DATE", left + 8, y);
    doc.text("DESCRIPTION", left + 90, y);
    doc.text("TYPE", left + 300, y);
    doc.text("AMOUNT", right - 8, y, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 20;

    for (const t of transactions) {
      if (y > 780) {
        doc.addPage();
        y = 56;
      }
      doc.setTextColor("#64748B");
      doc.text(date(t.createdAt), left + 8, y);
      doc.setTextColor("#0F172A");
      doc.text(doc.splitTextToSize(counterparty(t), 190)[0] as string, left + 90, y);
      doc.setTextColor("#64748B");
      doc.text(methodLabel(t.type), left + 300, y);
      doc.setTextColor(isCredit(t.type) ? "#16A34A" : "#DC2626");
      doc.text(
        `${isCredit(t.type) ? "+" : "-"}${walletMoney(t.amount, t.currency)}`,
        right - 8,
        y,
        { align: "right" }
      );
      y += 16;
    }
  }

  doc.setFontSize(8);
  doc.setTextColor("#94A3B8");
  doc.text(`Generated ${new Date().toLocaleString("en-NG")} · Rendi Business`, left, 820);

  return doc;
}

export function downloadReportPdf(transactions: Transaction[], options: ReportOptions) {
  const name = `${options.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${options.currency}.pdf`;
  reportPdf(transactions, options).save(name);
}

export function reportCsv(transactions: Transaction[]) {
  const header = ["Date", "Reference", "Description", "Type", "Direction", "Amount", "Fee", "Currency", "Status"];
  const rows = transactions.map((t) => [
    new Date(t.createdAt).toISOString(),
    t.reference,
    counterparty(t),
    methodLabel(t.type),
    isCredit(t.type) ? "Credit" : "Debit",
    t.amount,
    t.fee ?? "0",
    t.currency,
    t.status,
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
