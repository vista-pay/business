"use client";
import { use, useEffect, useState } from "react";
import { businessApi } from "@/lib/api";
import { InvoiceDetail, downloadInvoicePdf } from "@/lib/invoice-pdf";
import { publicUrl } from "@/lib/payment-links";
import { walletMoney } from "@/lib/wallets";
import { cn } from "@/lib/utils";

/** The customer's invoice: view, download, pay. No account required. */
export default function PublicInvoicePage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    businessApi
      .getPublicInvoice(hash)
      .then((res) => {
        if (!cancelled) setInvoice(res.data as InvoiceDetail);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "This invoice is not available.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hash]);

  const paid = invoice?.status?.toUpperCase() === "PAID";

  return (
    <main className="flex min-h-screen justify-center bg-[#F8FAFC] p-4 sm:p-8">
      <div className="w-full max-w-[720px]">
        {loading ? (
          <p className="py-20 text-center text-[15px] text-slate-500">Loading invoice…</p>
        ) : !invoice ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-[16px] font-semibold text-[#0F172A]">Invoice unavailable</p>
            <p className="mt-1 text-[14px] text-slate-500">{error ?? "This link is no longer valid."}</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/rendi-brand-symbol.png" alt="" className="h-12 w-12 rounded-xl" />
                <span>
                  <span className="block text-[16px] font-bold text-[#0F172A]">{invoice.businessName ?? "Rendi merchant"}</span>
                  {invoice.businessEmail && (
                    <span className="block text-[13px] text-slate-500">{invoice.businessEmail}</span>
                  )}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#2563EB]">Invoice</p>
                <p className="text-[15px] font-semibold text-[#0F172A]">{invoice.invoiceNumber}</p>
              </div>
            </div>

            <hr className="my-6 border-slate-200" />

            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-slate-400">Billed to</p>
                <p className="mt-1 text-[16px] font-bold text-[#0F172A]">{invoice.customerName}</p>
                <p className="text-[14px] text-slate-500">{invoice.customerEmail}</p>
              </div>
              <div className="flex gap-8">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-slate-400">Issued</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#0F172A]">{formatDate(invoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-slate-400">Due</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#0F172A]">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
            </div>

            <div className="mt-7 overflow-x-auto">
              <table className="w-full min-w-[460px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[12px] font-semibold uppercase tracking-[0.04em] text-slate-500">
                    <th className="py-3 pr-4">Description</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3 text-right">Unit price</th>
                    <th className="py-3 pl-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 text-[15px] last:border-0">
                      <td className="py-3.5 pr-4 font-semibold text-[#0F172A]">{item.description}</td>
                      <td className="py-3.5 px-3 text-right text-slate-600">{item.quantity}</td>
                      <td className="py-3.5 px-3 text-right text-slate-600">
                        {walletMoney(item.unitPrice, invoice.currencyCode)}
                      </td>
                      <td className="py-3.5 pl-3 text-right font-bold text-[#0F172A]">
                        {walletMoney(item.totalAmount, invoice.currencyCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-[300px]">
                <div className="flex items-center justify-between gap-4 text-[15px]">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-[#0F172A]">
                    {walletMoney(invoice.totalAmount, invoice.currencyCode)}
                  </span>
                </div>
                <hr className="my-3 border-slate-200" />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[16px] font-bold text-[#0F172A]">{paid ? "Total paid" : "Total due"}</span>
                  <span className={cn("text-[22px] font-bold", paid ? "text-[#16A34A]" : "text-[#2563EB]")}>
                    {walletMoney(invoice.totalAmount, invoice.currencyCode)}
                  </span>
                </div>
              </div>
            </div>

            <hr className="my-7 border-slate-200" />

            <div className="flex flex-wrap items-center gap-3">
              {paid ? (
                <p className="flex h-12 flex-1 items-center justify-center rounded-lg bg-[#DCFCE7] text-[15px] font-semibold text-[#15803D]">
                  Paid on {formatDate(invoice.paidAt)} — thank you
                </p>
              ) : (
                <a
                  href={publicUrl(hash)}
                  className="flex h-12 flex-1 items-center justify-center rounded-lg bg-[#2563EB] text-[15px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  Pay {walletMoney(invoice.totalAmount, invoice.currencyCode)}
                </a>
              )}
              <button
                type="button"
                onClick={() => downloadInvoicePdf(invoice, publicUrl(hash))}
                className="flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-[15px] font-semibold text-[#0F172A] transition-colors hover:bg-slate-50"
              >
                Download PDF
              </button>
            </div>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-[13px] text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Secured by Rendi
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
