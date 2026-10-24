"use client";
import { useState } from "react";
import { SidePanel } from "./side-panel";
import { Button } from "@/components/ui/button";
import { WalletAccountDetail } from "@/lib/wallets";

/** Figma 41:1239 — Wallet-Account-Panel. */
export function AccountDetailsPanel({
  account,
  businessName,
  businessStatus,
  onClose,
}: {
  account: WalletAccountDetail;
  businessName: string;
  businessStatus: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const accountName = account.vanAccountName ?? businessName;
  const accountNumber = account.vanAccountNumber ?? null;
  const bankName = account.vanBankName ?? null;

  const summary = [
    `Account name: ${accountName}`,
    `Account number: ${accountNumber ?? "—"}`,
    `Bank: ${bankName ?? "—"}`,
    `Currency: ${account.currencyCode}`,
  ].join("\n");

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <SidePanel title={`${account.currencyCode} Account Details`} onClose={onClose}>
      <hr className="-mt-1 mb-5 border-slate-200" />

      {accountNumber ? (
        <dl className="space-y-5">
          <Field label="Account Name" value={accountName} onCopy={() => copy("Account Name", accountName)} copied={copied === "Account Name"} />
          <Field label="Account Number" value={accountNumber} onCopy={() => copy("Account Number", accountNumber)} copied={copied === "Account Number"} />
          <Field label="Bank Name" value={bankName ?? "—"} />
          <Field label="Account Type" value="Business Current" />
          {/* The design shows BVN status; a company is verified through KYB. */}
          <Field label="Verification Status" value={statusLabel(businessStatus)} />
        </dl>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-[14px] text-slate-500">
          No dedicated account number has been issued for {account.currencyCode} yet. It is provisioned once KYB is
          approved.
        </p>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-lg bg-[#EFF6FF] px-4 py-3.5 text-[14px] leading-relaxed text-slate-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
        <span>
          Share these details to receive {account.currencyCode} payments from any bank in Nigeria. Standard settlement
          times apply.
        </span>
      </div>

      {accountNumber && (
        <div className="mt-8 space-y-3">
          <Button variant="outline" size="lg" className="w-full" onClick={() => copy("all", summary)}>
            {copied === "all" ? "Copied" : "Copy Account Details"}
          </Button>
          <Button
            variant="brand"
            size="lg"
            className="w-full"
            onClick={async () => {
              if (typeof navigator !== "undefined" && "share" in navigator) {
                try {
                  await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
                    title: `${businessName} — ${account.currencyCode} account`,
                    text: summary,
                  });
                  return;
                } catch {
                  // Fall through to the clipboard when sharing is dismissed.
                }
              }
              copy("all", summary);
            }}
          >
            Share Details
          </Button>
        </div>
      )}
    </SidePanel>
  );
}

function statusLabel(status: string) {
  if (status === "APPROVED") return "Verified";
  if (status === "REJECTED") return "Rejected";
  return "Pending review";
}

function Field({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <dt className="text-[12px] font-semibold uppercase tracking-[0.04em] text-slate-400">{label}</dt>
        <dd className="mt-0.5 break-words text-[16px] font-semibold text-[#0F172A]">{value}</dd>
      </div>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copy ${label}`}
          className="mt-4 shrink-0 text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
        >
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
              <path d="m5 13 4 4L19 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
