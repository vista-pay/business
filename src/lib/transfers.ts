// Shaping for Transfers (Figma 41:2066) and Beneficiaries (41:2453).
import { Transaction } from "./dashboard-data";

/** Outgoing rails, as the Transfers list labels them. */
export const TRANSFER_TYPES: Record<string, "Bank" | "Rendi" | "International"> = {
  WITHDRAWAL: "Bank",
  TRANSFER: "Rendi",
  INTERNATIONAL_TRANSFER: "International",
};

export const TRANSFER_RAILS = ["All", "Bank", "Rendi", "International"] as const;
export type TransferRail = (typeof TRANSFER_RAILS)[number];

export const TRANSFER_STATUSES = ["Status: All", "Success", "Pending", "Failed"] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export function isTransfer(t: Transaction) {
  return t.type in TRANSFER_TYPES;
}

export function railOf(t: Transaction) {
  return TRANSFER_TYPES[t.type] ?? "Bank";
}

const PENDING = new Set(["INITIATED", "PENDING", "PROCESSING"]);
const FAILED = new Set(["FAILED", "CANCELLED", "REVERSED"]);

export function filterTransfers(
  transactions: Transaction[],
  { search, rail, status }: { search: string; rail: TransferRail; status: TransferStatus },
  recipientOf: (t: Transaction) => string
) {
  const needle = search.trim().toLowerCase();
  return transactions.filter((t) => {
    if (!isTransfer(t)) return false;
    if (rail !== "All" && railOf(t) !== rail) return false;
    if (status === "Success" && t.status !== "SUCCESS") return false;
    if (status === "Pending" && !PENDING.has(t.status)) return false;
    if (status === "Failed" && !FAILED.has(t.status)) return false;
    if (!needle) return true;
    return recipientOf(t).toLowerCase().includes(needle) || t.reference.toLowerCase().includes(needle);
  });
}

export type Beneficiary = {
  id: string;
  type: "VISTA" | "BANK";
  displayName: string;
  identifier: string;
  vistaTag?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

/** The portal shows Rendi/Bank; `RecipientType` has no international value. */
export function beneficiaryRail(b: Beneficiary) {
  return b.type === "VISTA" ? "Rendi" : "Bank";
}

export function maskAccount(accountNumber?: string | null) {
  if (!accountNumber) return "—";
  return `****${accountNumber.slice(-4)}`;
}

export function idempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `k-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}
