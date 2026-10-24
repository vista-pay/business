"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/filter-select";
import { InvoiceLine, invoiceSubtotal, lineTotal } from "@/lib/payment-links";
import { walletMoney } from "@/lib/wallets";
import { PlusIcon } from "@/components/kyb/icons";

const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];

function newLine(): InvoiceLine {
  return { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" };
}

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Figma 41:3421 — Create-Invoice. */
export default function CreateInvoicePage() {
  const router = useRouter();
  const { business } = useDashboard();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(isoDate());
  const [dueDate, setDueDate] = useState(isoDate(30));
  const [currency, setCurrency] = useState("NGN");
  const [lines, setLines] = useState<InvoiceLine[]>([newLine()]);
  const [saving, setSaving] = useState<"draft" | "send" | null>(null);
  const [showProblems, setShowProblems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => invoiceSubtotal(lines), [lines]);

  // Collected rather than reduced to a boolean: a disabled button with no
  // explanation is why "Send Invoice" appeared to do nothing.
  const problems = useMemo(() => {
    const list: string[] = [];
    if (!business) list.push("You need a business before you can issue invoices.");
    if (!customerName.trim()) list.push("Add the customer you are billing.");
    if (!customerEmail.trim()) list.push("Add the customer's email — the invoice is sent there.");
    if (!dueDate) list.push("Set a due date.");
    if (!lines.some((l) => l.description.trim() && Number(l.quantity) > 0 && Number(l.unitPrice) > 0)) {
      list.push("Add at least one item with a description, quantity and unit price.");
    }
    return list;
  }, [business, customerName, customerEmail, dueDate, lines]);

  function update(id: string, patch: Partial<InvoiceLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function submit(mode: "draft" | "send") {
    if (problems.length > 0) {
      setShowProblems(true);
      return;
    }
    if (!business) return;
    setShowProblems(false);
    setSaving(mode);
    setError(null);
    try {
      const res = await businessApi.createInvoice({
        businessId: business.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        currencyCode: currency,
        dueDate: new Date(dueDate).toISOString(),
        items: lines
          .filter((l) => l.description.trim() && Number(l.quantity) > 0 && Number(l.unitPrice) > 0)
          .map((l) => ({
            description: l.description.trim(),
            quantity: Number(l.quantity),
            unitPrice: String(Number(l.unitPrice)),
          })),
      });
      const created = res.data as { id?: string };
      // "Send" issues the invoice, which mints the link the customer pays
      // through. Land on the invoice itself so that link is right there.
      if (mode === "send" && created?.id) await businessApi.issueInvoice(created.id);
      router.push(created?.id ? `/invoices/${created.id}` : "/invoices");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create this invoice.");
      setSaving(null);
    }
  }

  return (
    <>
      <PageHeader title="Create Invoice" />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-bold text-[#0F172A]">Invoice Info</h2>
            <p className="text-[14px] text-slate-500">
              Invoice Number: <span className="font-bold text-[#0F172A]">assigned on save</span>
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="space-y-4">
              <Input
                label="Bill To"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="TechBridge Solutions"
              />
              <Input
                label="Customer email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="billing@techbridge.com"
              />
            </div>
            <Input label="Invoice Date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Currency</span>
              <FilterSelect options={CURRENCIES} value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[13px] font-semibold text-slate-600">
                  <th className="w-12 px-5 py-3">#</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="w-24 px-5 py-3 text-right">Qty</th>
                  <th className="w-44 px-5 py-3 text-right">Unit Price</th>
                  <th className="w-44 px-5 py-3 text-right">Total</th>
                  <th className="w-12 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={line.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 text-[15px] text-slate-500">{i + 1}</td>
                    <td className="px-5 py-3">
                      <input
                        value={line.description}
                        onChange={(e) => update(line.id, { description: e.target.value })}
                        placeholder="Software Development Services"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[15px] font-semibold text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        value={line.quantity}
                        onChange={(e) => update(line.id, { quantity: e.target.value.replace(/\D/g, "") })}
                        inputMode="numeric"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-right text-[15px] text-slate-900 focus:border-[#2563EB] focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        value={line.unitPrice}
                        onChange={(e) => update(line.id, { unitPrice: e.target.value.replace(/[^\d.]/g, "") })}
                        inputMode="decimal"
                        placeholder="0.00"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-right text-[15px] text-slate-900 focus:border-[#2563EB] focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3 text-right text-[15px] font-bold text-[#0F172A]">
                      {walletMoney(lineTotal(line), currency)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((l) => l.id !== line.id))}
                          aria-label={`Remove line ${i + 1}`}
                          className="text-slate-400 hover:text-[#DC2626]"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-6 p-5">
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, newLine()])}
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#2563EB] hover:underline"
            >
              <PlusIcon className="h-4 w-4" />
              Add Item
            </button>

            <dl className="w-full max-w-[340px] space-y-2 text-[15px]">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-semibold text-[#0F172A]">{walletMoney(subtotal, currency)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Tax</dt>
                <dd className="text-slate-500">Not applied</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Discount</dt>
                <dd className="text-slate-500">None</dd>
              </div>
              <hr className="border-slate-200" />
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-[#0F172A]">Total Amount</dt>
                <dd className="text-[20px] font-bold text-[#2563EB]">{walletMoney(subtotal, currency)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="flex flex-wrap items-end justify-between gap-6">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Notes / Terms</span>
            <textarea
              rows={3}
              disabled
              placeholder="Payment terms: Net 30"
              className="w-full max-w-[600px] cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[15px] text-slate-500"
            />
            <span className="mt-1 block text-[13px] text-slate-500">
              Notes, tax and discounts are coming soon. Until then the invoice total is exactly the sum of its items,
              so what you send is what your customer is charged.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="lg" onClick={() => submit("draft")} loading={saving === "draft"} disabled={saving !== null}>
              Save Draft
            </Button>
            <Button variant="brand" size="lg" onClick={() => submit("send")} loading={saving === "send"} disabled={saving !== null}>
              Send Invoice
            </Button>
          </div>
        </section>

        {showProblems && problems.length > 0 && (
          <div className="rounded-lg border border-[#F59E0B] bg-[#FEF3C7] px-4 py-3 text-sm text-[#B45309]">
            <p className="font-semibold">This invoice isn&apos;t ready to send yet</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>
    </>
  );
}
