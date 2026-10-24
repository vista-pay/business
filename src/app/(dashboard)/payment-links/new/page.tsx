"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/filter-select";
import { EXPIRY_OPTIONS, ExpiryOption, expiryToIso } from "@/lib/payment-links";
import { walletMoney } from "@/lib/wallets";
import { cn } from "@/lib/utils";

const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];

/** Figma 41:3035 — Create-Payment-Link. */
export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const { business } = useDashboard();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fixed, setFixed] = useState(true);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [expiry, setExpiry] = useState<ExpiryOption>("30 days");
  const [requireName, setRequireName] = useState(true);
  const [requireEmail, setRequireEmail] = useState(true);
  const [requirePhone, setRequirePhone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = title.trim() && business && (!fixed || Number(amount) > 0);

  async function create() {
    if (!business) return;
    setSaving(true);
    setError(null);
    try {
      const res = await businessApi.createPaymentLink({
        businessId: business.id,
        title: title.trim(),
        description: description.trim() || undefined,
        currencyCode: currency,
        isFixedAmount: fixed,
        ...(fixed ? { amount: String(Number(amount)) } : {}),
      });
      const created = res.data as { id?: string };
      // Expiry is a separate concern from creation in the API.
      const expiresAt = expiryToIso(expiry);
      if (created?.id && expiresAt) {
        await businessApi.updatePaymentLink(created.id, { expiresAt }).catch(() => {});
      }
      router.push(created?.id ? `/payment-links/${created.id}` : "/payment-links");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create this link.");
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Create Payment Link" />

      <div className="grid flex-1 gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_420px] lg:p-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="space-y-5">
            <Input label="Link Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Annual Conference 2025" />

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Registration fee for Rendi Global Annual Conference"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
              />
            </label>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Amount Type</legend>
              <div className="flex flex-wrap gap-6">
                <Radio label="Fixed Amount" checked={fixed} onChange={() => setFixed(true)} />
                <Radio label="Customer Enters Amount" checked={!fixed} onChange={() => setFixed(false)} />
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="75,000.00"
                disabled={!fixed}
                hint={!fixed ? "The customer chooses how much to pay" : undefined}
              />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Currency</span>
                <FilterSelect
                  options={CURRENCIES}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-10"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Link Expiry</span>
              <FilterSelect
                options={EXPIRY_OPTIONS}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value as ExpiryOption)}
                className="h-10"
              />
            </label>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Required Customer Information</legend>
              <div className="flex flex-wrap gap-6">
                <Check label="Name" checked={requireName} onChange={setRequireName} />
                <Check label="Email" checked={requireEmail} onChange={setRequireEmail} />
                <Check label="Phone" checked={requirePhone} onChange={setRequirePhone} />
              </div>
              <p className="mt-2 text-[13px] text-slate-500">
                Shown on the payment page. The API does not store this choice yet, so every page asks for name and
                email.
              </p>
            </fieldset>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <div className="flex items-center gap-4 pt-1">
              <Button variant="brand" size="lg" onClick={create} loading={saving} disabled={!valid}>
                Create Link
              </Button>
              <button type="button" onClick={() => router.push("/payment-links")} className="text-[15px] text-[#0F172A] hover:underline">
                Cancel
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Live Preview</h2>
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#2563EB]">Rendi Pay</span>
              <span
                className={cn(
                  "rounded-md px-2 py-1 text-[12px] font-semibold",
                  business?.status === "APPROVED" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF3C7] text-[#B45309]"
                )}
              >
                {business?.status === "APPROVED" ? "Verified Business" : "Unverified Business"}
              </span>
            </div>

            <h3 className="mt-4 text-[20px] font-bold tracking-tight text-[#0F172A]">
              {title.trim() || "Link title"}
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-slate-500">
              {description.trim() || "Description shown to the customer"}
            </p>

            <hr className="my-4 border-slate-200" />

            <p className="text-[14px] text-slate-500">Total Amount</p>
            <p className="text-[24px] font-bold tracking-tight text-[#0F172A]">
              {fixed && Number(amount) > 0 ? walletMoney(amount, currency) : "Customer enters amount"}
            </p>

            <hr className="my-4 border-slate-200" />

            <div className="space-y-3">
              {requireName && <PreviewField label="Full Name" />}
              {requireEmail && <PreviewField label="Email Address" />}
              {requirePhone && <PreviewField label="Phone Number" />}
            </div>

            <div className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-[#2563EB] text-[15px] font-semibold text-white">
              {fixed && Number(amount) > 0 ? `Pay ${walletMoney(amount, currency)}` : "Pay"}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Radio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-[15px] text-slate-700">
      <input type="radio" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#2563EB]" />
      {label}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[15px] text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[18px] w-[18px] rounded border-slate-300 accent-[#2563EB]"
      />
      {label}
    </label>
  );
}

function PreviewField({ label }: { label: string }) {
  return (
    <div>
      <p className="text-[13px] text-slate-500">{label}</p>
      <div className="mt-1 h-10 rounded-lg border border-slate-200 bg-white" />
    </div>
  );
}
