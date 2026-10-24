import { jsPDF } from "jspdf";
import { walletMoney } from "./wallets";

export type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  currencyCode: string;
  status: string;
  dueDate: string;
  createdAt?: string;
  paidAt?: string | null;
  businessName?: string | null;
  businessEmail?: string | null;
  linkHash?: string | null;
  items: Array<{ id: string; description: string; quantity: number; unitPrice: string; totalAmount: string }>;
};

function date(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * A4 invoice document. Laid out directly rather than screenshotting the page so
 * the download is real text - selectable, searchable and printable at any size.
 */
export function invoicePdf(invoice: InvoiceDetail, payUrl?: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  const right = 547;
  let y = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor("#0F172A");
  doc.text(invoice.businessName ?? "Invoice", left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#64748B");
  if (invoice.businessEmail) doc.text(invoice.businessEmail, left, y + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor("#2563EB");
  doc.text("INVOICE", right, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#0F172A");
  doc.text(invoice.invoiceNumber, right, y + 16, { align: "right" });

  y += 46;
  doc.setDrawColor("#E2E8F0");
  doc.line(left, y, right, y);

  y += 26;
  doc.setFontSize(9);
  doc.setTextColor("#64748B");
  doc.text("BILL TO", left, y);
  doc.text("ISSUED", 330, y);
  doc.text("DUE", 450, y);

  y += 15;
  doc.setFontSize(11);
  doc.setTextColor("#0F172A");
  doc.setFont("helvetica", "bold");
  doc.text(invoice.customerName, left, y);
  doc.setFont("helvetica", "normal");
  doc.text(date(invoice.createdAt), 330, y);
  doc.text(date(invoice.dueDate), 450, y);

  y += 14;
  doc.setFontSize(10);
  doc.setTextColor("#64748B");
  doc.text(invoice.customerEmail, left, y);

  y += 34;
  doc.setFillColor("#F8FAFC");
  doc.rect(left, y - 14, right - left, 24, "F");
  doc.setFontSize(9);
  doc.setTextColor("#475569");
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", left + 10, y);
  doc.text("QTY", 350, y, { align: "right" });
  doc.text("UNIT PRICE", 440, y, { align: "right" });
  doc.text("TOTAL", right - 10, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor("#0F172A");
  doc.setFontSize(10);
  y += 26;

  for (const item of invoice.items) {
    const lines = doc.splitTextToSize(item.description, 260) as string[];
    doc.text(lines, left + 10, y);
    doc.text(String(item.quantity), 350, y, { align: "right" });
    doc.text(walletMoney(item.unitPrice, invoice.currencyCode), 440, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(walletMoney(item.totalAmount, invoice.currencyCode), right - 10, y, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += Math.max(lines.length * 13, 13) + 9;
    doc.setDrawColor("#F1F5F9");
    doc.line(left, y - 12, right, y - 12);

    if (y > 720) {
      doc.addPage();
      y = 64;
    }
  }

  y += 10;
  doc.setFontSize(10);
  doc.setTextColor("#64748B");
  doc.text("Subtotal", 440, y, { align: "right" });
  doc.setTextColor("#0F172A");
  doc.text(walletMoney(invoice.totalAmount, invoice.currencyCode), right - 10, y, { align: "right" });

  y += 22;
  doc.setDrawColor("#E2E8F0");
  doc.line(360, y - 12, right, y - 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total due", 440, y, { align: "right" });
  doc.setTextColor("#2563EB");
  doc.text(walletMoney(invoice.totalAmount, invoice.currencyCode), right - 10, y, { align: "right" });

  y += 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#0F172A");
  doc.text(`Status: ${invoice.status}`, left, y);
  if (invoice.paidAt) doc.text(`Paid on ${date(invoice.paidAt)}`, left, y + 14);

  if (payUrl) {
    y += invoice.paidAt ? 32 : 18;
    doc.setTextColor("#64748B");
    doc.text("Pay this invoice online:", left, y);
    doc.setTextColor("#2563EB");
    doc.textWithLink(payUrl, left, y + 14, { url: payUrl });
  }

  doc.setFontSize(9);
  doc.setTextColor("#94A3B8");
  doc.text("Secured by Rendi", left, 800);

  return doc;
}

export function downloadInvoicePdf(invoice: InvoiceDetail, payUrl?: string) {
  invoicePdf(invoice, payUrl).save(`${invoice.invoiceNumber}.pdf`);
}
