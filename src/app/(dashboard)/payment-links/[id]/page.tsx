"use client";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { LinkStatusBadge } from "../page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/dashboard/modal";
import { QrCode } from "@/components/dashboard/qr-code";
import QRCode from "qrcode";
import { PaymentLink, expiryNote, linkStatus, publicUrl } from "@/lib/payment-links";
import { Transaction, counterparty } from "@/lib/dashboard-data";
import { walletMoney } from "@/lib/wallets";

/** Figma 41:3145 — Payment-Link-Detail. */
export default function PaymentLinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { business } = useDashboard();

  const [link, setLink] = useState<PaymentLink | null>(null);
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [one, list, tx] = await Promise.allSettled([
      businessApi.getPaymentLink(id),
      business ? businessApi.listPaymentLinks(business.id) : Promise.resolve({ data: [] }),
      business
        ? businessApi.listTransactions({ businessId: business.id, limit: 100 })
        : Promise.resolve({ data: { items: [] } }),
    ]);

    // The public endpoint omits isActive/currentUses, so the owner's list is
    // the source for everything the management screen needs.
    let resolved: PaymentLink | null = null;
    if (list.status === "fulfilled") {
      const all = list.value.data as PaymentLink[] | undefined;
      resolved = Array.isArray(all) ? (all.find((l) => l.id === id) ?? null) : null;
    }
    if (!resolved && one.status === "fulfilled") resolved = one.value.data as PaymentLink;
    setLink(resolved);

    if (tx.status === "fulfilled") {
      const items = (tx.value.data as { items?: Transaction[] })?.items ?? [];
      setPayments(items.filter((t) => t.type === "PAYMENT_LINK"));
    }
    setLoading(false);
  }, [id, business]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive() {
    if (!link) return;
    setBusy(true);
    setError(null);
    try {
      await businessApi.updatePaymentLink(link.id, { isActive: !link.isActive });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update this link.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!link) return;
    setBusy(true);
    setError(null);
    try {
      await businessApi.deletePaymentLink(link.id);
      router.push("/payment-links");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not delete this link.");
      setBusy(false);
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(publicUrl(link.linkHash));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Payment Link" />
        <p className="p-8 text-[15px] text-slate-500">Loading…</p>
      </>
    );
  }

  if (!link) {
    return (
      <>
        <PageHeader title="Payment Link" />
        <p className="p-8 text-[15px] text-slate-500">This payment link no longer exists.</p>
      </>
    );
  }

  const expiry = expiryNote(link.expiresAt);
  const received = payments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <>
      <PageHeader title={link.title} />

      <div className="grid flex-1 gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_380px] lg:p-8">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <LinkStatusBadge status={linkStatus(link)} />
            <span className="text-[14px] text-slate-500">
              Created on{" "}
              {new Date(link.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          <h2 className="mt-4 text-[24px] font-bold tracking-tight text-[#0F172A]">{link.title}</h2>
          <p className="mt-1 text-[26px] font-bold tracking-tight text-[#2563EB]">
            {link.isFixedAmount && link.amount
              ? walletMoney(link.amount, link.currencyCode)
              : "Customer enters amount"}
          </p>

          {expiry && (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-4 py-3 text-[14px] text-slate-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M8 3v4M16 3v4M3 11h18" />
              </svg>
              <span>
                Link {expiry.expired ? "expired on" : "expires on"}{" "}
                <span className="font-semibold text-[#0F172A]">{expiry.formatted}</span>{" "}
                {!expiry.expired && `(${expiry.remaining})`}
              </span>
            </p>
          )}

          <p className="mt-6 text-[14px] text-slate-500">Sharable Payment Link</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <input
              readOnly
              value={publicUrl(link.linkHash)}
              className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 text-[15px] text-slate-700"
            />
            <Button variant="outline" size="lg" onClick={copy} className="border-[#2563EB] text-[#2563EB]">
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <p className="mt-6 text-[14px] text-slate-500">QR Code for In-person payments</p>
          <div className="mt-1.5 flex flex-wrap items-end gap-4">
            <QrCode value={publicUrl(link.linkHash)} />
            <button
              type="button"
              onClick={() => downloadQr(link.linkHash, link.title)}
              className="text-[15px] font-semibold text-[#2563EB] hover:underline"
            >
              Download QR
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button variant="outline" size="lg" onClick={toggleActive} loading={busy}>
              {link.isActive ? "Disable Link" : "Enable Link"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => setEditing(true)}>
              Edit Link
            </Button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="text-[15px] font-semibold text-[#DC2626] hover:underline disabled:opacity-50"
            >
              Delete Link
            </button>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">Payments Received</h3>
            <div className="mt-3 flex items-end justify-between gap-4">
              <span className="text-[28px] font-bold tracking-tight text-[#0F172A]">{link.currentUses}</span>
              <span className="text-[17px] font-bold text-[#16A34A]">{walletMoney(received, link.currencyCode)}</span>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">Recent Transactions</h3>
            {payments.length === 0 ? (
              <p className="mt-3 text-[14px] text-slate-500">No payments through links yet.</p>
            ) : (
              <ul className="mt-3">
                {payments.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold text-[#0F172A]">{counterparty(t)}</span>
                      <span className="block text-[12px] text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[15px] font-bold text-[#0F172A]">
                        {walletMoney(t.amount, t.currency)}
                      </span>
                      <span className="block text-[12px] font-semibold text-[#16A34A]">
                        {t.status === "SUCCESS" ? "● Success" : t.status}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {editing && (
        <EditLinkModal
          link={link}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </>
  );
}

/** Saves a print-ready PNG for posters, receipts and counter displays. */
async function downloadQr(linkHash: string, title: string) {
  const url = await QRCode.toDataURL(publicUrl(linkHash), {
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-qr.png`;
  anchor.click();
}

function EditLinkModal({
  link,
  onClose,
  onSaved,
}: {
  link: PaymentLink;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(link.title);
  const [description, setDescription] = useState(link.description ?? "");
  const [amount, setAmount] = useState(link.amount ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await businessApi.updatePaymentLink(link.id, {
        title: title.trim(),
        description: description.trim(),
        ...(link.isFixedAmount && amount ? { amount: String(Number(amount)) } : {}),
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save these changes.");
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Link" onClose={onClose} width="max-w-[520px]">
      <div className="space-y-4">
        <Input label="Link Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[15px] text-slate-900 focus:border-[#2563EB] focus:outline-none"
          />
        </label>
        {link.isFixedAmount && (
          <Input
            label={`Amount (${link.currencyCode})`}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          />
        )}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </div>
      <div className="mt-7 flex items-center justify-between gap-4">
        <button type="button" onClick={onClose} className="text-[15px] text-[#0F172A] hover:underline">
          Cancel
        </button>
        <Button variant="brand" size="lg" onClick={save} loading={saving} disabled={!title.trim()}>
          Save changes
        </Button>
      </div>
    </Modal>
  );
}
