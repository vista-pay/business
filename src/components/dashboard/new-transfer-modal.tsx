"use client";
import { useEffect, useState } from "react";
import { businessApi } from "@/lib/api";
import { Modal } from "./modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletAccount } from "./dashboard-context";
import { Beneficiary, idempotencyKey } from "@/lib/transfers";
import { money } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

type Rail = "Bank Transfer" | "Rendi Transfer" | "International";
const RAILS: Rail[] = ["Bank Transfer", "Rendi Transfer", "International"];

type Quote = { fee: number; total: number; available: number; canAfford: boolean };

/**
 * New Transfer (41:2228) and Review Transfer (41:2347).
 *
 * Only the bank rail is wired: `POST /withdrawals` accepts a `businessId` and
 * debits the company wallet. The Rendi and international rails still debit the
 * caller's personal wallet server-side, so they are shown but not submittable.
 */
export function NewTransferModal({
  businessId,
  accounts,
  onClose,
  onDone,
}: {
  businessId: string;
  accounts: WalletAccount[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [rail, setRail] = useState<Rail>("Bank Transfer");
  const [step, setStep] = useState<"form" | "review">("form");

  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const account = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const currency = account?.currencyCode ?? "NGN";

  useEffect(() => {
    businessApi
      .listBeneficiaries()
      .then((res) => {
        const list = res.data as Beneficiary[] | undefined;
        setBeneficiaries(Array.isArray(list) ? list.filter((b) => b.type === "BANK") : []);
      })
      .catch(() => setBeneficiaries([]));
  }, []);

  function pickBeneficiary(id: string) {
    setBeneficiaryId(id);
    const b = beneficiaries.find((item) => item.id === id);
    if (!b) return;
    setBankName(b.bankName ?? "");
    setBankCode(b.bankCode ?? "");
    setAccountNumber(b.accountNumber ?? "");
    setAccountName(b.displayName);
  }

  /** Server-side name check — the payout is made against this, not the label. */
  async function resolve() {
    if (accountNumber.length !== 10 || !bankCode) return;
    setResolving(true);
    setError(null);
    try {
      const res = await businessApi.resolveAccount({ accountNumber, bankCode });
      const data = res.data as { accountName?: string; bankName?: string };
      if (data?.accountName) setAccountName(data.accountName);
      if (data?.bankName) setBankName(data.bankName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not verify this account.");
    } finally {
      setResolving(false);
    }
  }

  const formValid =
    rail === "Bank Transfer" &&
    account &&
    bankCode.trim() &&
    bankName.trim() &&
    accountNumber.trim().length === 10 &&
    accountName.trim() &&
    Number(amount) > 0;

  async function goToReview() {
    setBusy(true);
    setError(null);
    try {
      const res = await businessApi.quoteWithdrawal({ amount, currencyCode: currency, businessId });
      const data = res.data as {
        feeAmount?: string;
        totalDebit?: string;
        availableBalance?: string;
        canAfford?: boolean;
      };
      const fee = Number(data?.feeAmount ?? 0);
      setQuote({
        fee,
        total: Number(data?.totalDebit ?? Number(amount) + fee),
        available: Number(data?.availableBalance ?? 0),
        canAfford: data?.canAfford !== false,
      });
      setStep("review");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not price this transfer.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await businessApi.initiateWithdrawal(
        {
          amount,
          currencyCode: currency,
          bankCode: bankCode.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          pin,
          businessId,
        },
        idempotencyKey()
      );
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "The transfer could not be completed.");
      setBusy(false);
    }
  }

  if (step === "review") {
    return (
      <Modal title="Review Transfer" onClose={onClose}>
        <dl className="rounded-xl bg-[#F8FAFC] px-5 py-4 text-[15px]">
          <Row label="From" value={`${currency} Wallet`} />
          <Row label="To" value={`${accountName} — ${bankName} ${accountNumber.slice(-4).padStart(8, "*")}`} />
          <Row label="Amount" value={money(amount, currency)} accent />
          <Row label="Transfer Fee" value={money(quote?.fee ?? 0, currency)} />
          <Row label="Total Debit" value={money(quote?.total ?? Number(amount), currency)} strong />
          <Row label="Estimated Time" value="Within 5 minutes" />
        </dl>

        <div className="mt-6 text-center">
          <p className="text-[14px] text-slate-600">Enter your PIN to confirm</p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Transaction PIN"
            className="mx-auto mt-3 h-12 w-40 rounded-xl border border-slate-200 bg-white text-center text-[22px] tracking-[0.5em] text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            type="password"
          />
        </div>

        {quote && !quote.canAfford && (
          <div className="mt-4 rounded-lg border border-[#F59E0B] bg-[#FEF3C7] px-4 py-3 text-sm text-[#B45309]">
            This wallet holds {money(quote.available, currency)} — not enough to cover{" "}
            {money(quote.total, currency)}.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-7 flex items-center justify-between gap-4">
          <button type="button" onClick={() => setStep("form")} className="text-[15px] text-[#0F172A] hover:underline">
            Back
          </button>
          <Button
            size="lg"
            onClick={confirm}
            loading={busy}
            disabled={pin.length !== 4 || quote?.canAfford === false}
            className="bg-[#16A34A] text-white hover:bg-[#15803D]"
          >
            Confirm Transfer
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="New Transfer" onClose={onClose}>
      <div className="flex gap-6 overflow-x-auto border-b border-slate-200">
        {RAILS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRail(option)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 pb-3 text-[15px] font-semibold transition-colors",
              rail === option ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {rail !== "Bank Transfer" ? (
        <div className="mt-6 rounded-lg border border-[#F59E0B] bg-[#FEF3C7] px-5 py-4 text-[14px] text-[#B45309]">
          <p className="font-semibold">Not available from a business wallet yet</p>
          <p className="mt-1">
            {rail === "Rendi Transfer"
              ? "Rendi-to-Rendi transfers still debit the initiator's personal wallet server-side."
              : "International payouts are not wired to business wallets yet."}{" "}
            Use Bank Transfer, which settles from this company&apos;s balance.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">From Wallet</span>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 text-[15px] text-slate-900 focus:border-[#2563EB] focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.currencyCode} Wallet — {money(a.availableBalance, a.currencyCode)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Recipient</span>
            <select
              value={beneficiaryId}
              onChange={(e) => pickBeneficiary(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-[15px] text-slate-900 focus:border-[#2563EB] focus:outline-none"
            >
              <option value="">Enter details manually</option>
              {beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.displayName}
                </option>
              ))}
            </select>
            {beneficiaryId && (
              <span className="mt-1.5 block text-[13px] font-semibold text-[#16A34A]">
                ✓ Beneficiary selected from your saved list
              </span>
            )}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="GTBank" />
            <Input
              label="Bank code"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value.replace(/\D/g, ""))}
              placeholder="058"
            />
          </div>

          <Input
            label="Account Number"
            inputMode="numeric"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            onBlur={resolve}
            placeholder="0123456789"
            hint={resolving ? "Verifying…" : accountName ? `Resolved: ${accountName}` : "10-digit NUBAN"}
          />

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Amount</span>
            <span className="flex h-11 items-stretch overflow-hidden rounded-lg border border-slate-200">
              <span className="flex items-center bg-[#F8FAFC] px-3 text-[15px] font-semibold text-slate-600">
                {currency}
              </span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                placeholder="500000.00"
                className="min-w-0 flex-1 px-3 text-[15px] text-slate-900 focus:outline-none"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Purpose / Note (Optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Q3 Logistics & Transport Services Payout"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
            />
          </label>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between gap-4">
        <button type="button" onClick={onClose} className="text-[15px] text-[#0F172A] hover:underline">
          Cancel
        </button>
        <Button variant="brand" size="lg" onClick={goToReview} loading={busy} disabled={!formValid}>
          Review Transfer
        </Button>
      </div>
    </Modal>
  );
}

function Row({ label, value, accent, strong }: { label: string; value: string; accent?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd
        className={cn(
          "text-right",
          accent ? "font-bold text-[#2563EB]" : strong ? "font-bold text-[#0F172A]" : "font-semibold text-[#0F172A]"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
