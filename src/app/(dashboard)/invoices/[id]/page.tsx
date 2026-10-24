"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { businessApi } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { QrCode } from "@/components/dashboard/qr-code";
import { InvoiceDetail, downloadInvoicePdf } from "@/lib/invoice-pdf";
import { publicUrl } from "@/lib/payment-links";
import { walletMoney } from "@/lib/wallets";
import { cn } from "@/lib/utils";

/** The invoice's own page: what was billed, and how to get it to the customer. */
export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await businessApi.getInvoice(id);
      setInvoice(res.data as InvoiceDetail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load this invoice.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const shareUrl = invoice?.linkHash ? `${typeof window === "undefined" ? "" : window.location.origin}/i/${invoice.linkHash}` : null;
  const payUrl = invoice?.linkHash ? publicUrl(invoice.linkHash) : undefined;

  async function send() {
    if (!invoice) return;
    setBusy(true);
    setError(null);
    try {
      await businessApi.issueInvoice(invoice.id);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not issue this invoice.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  function emailToCustomer() {
    if (!invoice || !shareUrl) return;
    const subject = `Invoice ${invoice.invoiceNumber} from ${invoice.businessName ?? "us"}`;
    const body = [
      `Hi ${invoice.customerName},`,
      "",
      `Here is invoice ${invoice.invoiceNumber} for ${walletMoney(invoice.totalAmount, invoice.currencyCode)}.`,
      `View and pay it here: ${shareUrl}`,
      "",
      `Due ${new Date(invoice.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}.`,
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(invoice.customerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Invoice" />
        <p className="p-8 text-[15px] text-slate-500">Loading…</p>
      </>
    );
  }

  if (!invoice) {
    return (
      <>
        <PageHeader title="Invoice" />
        <p className="p-8 text-[15px] text-slate-500">{error ?? "This invoice could not be found."}</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={invoice.invoiceNumber}
        description={`${invoice.customerName} · ${walletMoney(invoice.totalAmount, invoice.currencyCode)}`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="lg" onClick={() => downloadInvoicePdf(invoice, payUrl)}>
              Download PDF
            </Button>
            {invoice.linkHash ? (
              <Button variant="brand" size="lg" onClick={emailToCustomer}>
                Email to customer
              </Button>
            ) : (
              <Button variant="brand" size="lg" onClick={send} loading={busy}>
                Send Invoice
              </Button>
            )}
          </div>
        }
      />

      <div className="grid flex-1 gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_380px] lg:p-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[13px] text-slate-500">Billed to</p>
              <p className="text-[17px] font-bold text-[#0F172A]">{invoice.customerName}</p>
              <p className="text-[14px] text-slate-500">{invoice.customerEmail}</p>
            </div>
            <InvoiceStatus status={invoice.status} />
          </div>

          <div className="mt-5 flex flex-wrap gap-8 text-[14px]">
            <span>
              <span className="block text-slate-500">Issued</span>
              <span className="font-semibold text-[#0F172A]">{formatDate(invoice.createdAt)}</span>
            </span>
            <span>
              <span className="block text-slate-500">Due</span>
              <span className="font-semibold text-[#0F172A]">{formatDate(invoice.dueDate)}</span>
            </span>
            {invoice.paidAt && (
              <span>
                <span className="block text-slate-500">Paid</span>
                <span className="font-semibold text-[#16A34A]">{formatDate(invoice.paidAt)}</span>
              </span>
            )}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                  <th className="py-3 pr-4">Description</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 pl-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 text-[15px] last:border-0">
                    <td className="py-3.5 pr-4 font-semibold text-[#0F172A]">{item.description}</td>
                    <td className="py-3.5 px-4 text-right text-slate-600">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {walletMoney(item.unitPrice, invoice.currencyCode)}
                    </td>
                    <td className="py-3.5 pl-4 text-right font-bold text-[#0F172A]">
                      {walletMoney(item.totalAmount, invoice.currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <dl className="w-full max-w-[300px] space-y-2 text-[15px]">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-semibold text-[#0F172A]">
                  {walletMoney(invoice.totalAmount, invoice.currencyCode)}
                </dd>
              </div>
              <hr className="border-slate-200" />
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-[#0F172A]">Total due</dt>
                <dd className="text-[20px] font-bold text-[#2563EB]">
                  {walletMoney(invoice.totalAmount, invoice.currencyCode)}
                </dd>
              </div>
            </dl>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Send this invoice</h2>

          {shareUrl ? (
            <>
              <p className="mt-1 text-[14px] text-slate-500">
                Anyone with this link can view the invoice, download it, and pay it.
              </p>

              <p className="mt-4 text-[13px] text-slate-500">Invoice link</p>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 text-[14px] text-slate-700"
                />
                <Button variant="outline" size="lg" onClick={() => copy("link", shareUrl)} className="border-[#2563EB] text-[#2563EB]">
                  {copied === "link" ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="mt-5 flex justify-center">
                <QrCode value={shareUrl} size={150} />
              </div>

              <div className="mt-5 space-y-3">
                <Button variant="brand" size="lg" className="w-full" onClick={emailToCustomer}>
                  Email to {invoice.customerName}
                </Button>
                <Link
                  href={`/i/${invoice.linkHash}`}
                  target="_blank"
                  className="flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-[15px] font-semibold text-[#0F172A] hover:bg-slate-50"
                >
                  Preview customer view
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-[14px] text-slate-500">
                This invoice is still a draft. Sending it creates a shareable link your customer can pay through.
              </p>
              <Button variant="brand" size="lg" className="mt-4 w-full" onClick={send} loading={busy}>
                Send Invoice
              </Button>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function InvoiceStatus({ status }: { status: string }) {
  const value = status.toUpperCase();
  const tone =
    value === "PAID"
      ? "bg-[#DCFCE7] text-[#15803D]"
      : value === "OVERDUE"
        ? "bg-[#FEF3C7] text-[#B45309]"
        : value === "SENT"
          ? "bg-[#EFF6FF] text-[#2563EB]"
          : value === "CANCELLED"
            ? "bg-red-100 text-red-700"
            : "bg-slate-100 text-slate-600";
  return (
    <span className={cn("rounded-md px-2.5 py-1 text-[12px] font-semibold", tone)}>
      {value.charAt(0) + value.slice(1).toLowerCase()}
    </span>
  );
}
