/** Handover between /register and /verify - cleared once the code is accepted. */
export const PENDING_VERIFICATION_KEY = "rendi_business_pending_verification";

export type PendingVerification = {
  identifier: string;
  channel: string;
  /** Only present outside production, where the API echoes the code back. */
  debugOtp: string | null;
};

export function readPendingVerification(): PendingVerification | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_VERIFICATION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingVerification;
  } catch {
    return null;
  }
}

export function clearPendingVerification() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
}
