// Shape and persistence for the 5-step "Set Up Your Business Account" flow
// (Figma 06 — Business, frames 41:10 → 41:470).
//
// Only the Business Details step maps onto an API today (`POST /businesses`).
// Documents and directors have no backend yet, so the whole application lives
// in a local draft until submit — which is also what the design's "Save Draft"
// and "Save & Continue Later" affordances imply.

const DRAFT_KEY = "rendi_business_kyb_draft";

export type DocumentKey = "CAC" | "MEMART" | "PROOF_OF_ADDRESS" | "TIN";

export type KybDocument = {
  key: DocumentKey;
  title: string;
  description: string;
  required: boolean;
};

export const KYB_DOCUMENTS: KybDocument[] = [
  { key: "CAC", title: "CAC Certificate", description: "Certificate of incorporation", required: true },
  { key: "MEMART", title: "Memorandum of Association", description: "MEMART document", required: true },
  { key: "PROOF_OF_ADDRESS", title: "Proof of Address", description: "Utility bill or bank statement (last 3 months)", required: true },
  { key: "TIN", title: "Tax Identification", description: "TIN certificate", required: false },
];

export const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const KYB_STEPS = [
  { label: "Business Info", title: "Business Information" },
  { label: "Documents", title: "Business Documents" },
  { label: "Directors & Owners", title: "Directors & Beneficial Owners" },
  { label: "Review & Submit", title: "Review & Submit" },
  { label: "Verification", title: "Verification" },
];

export const INDUSTRIES = [
  "Financial Technology",
  "Retail & E-commerce",
  "Logistics & Transport",
  "Education",
  "Healthcare",
  "Hospitality",
  "Agriculture",
  "Media & Entertainment",
  "Professional Services",
  "Manufacturing",
  "Other",
];

export const BUSINESS_TYPES = [
  "Private Limited Company",
  "Public Limited Company",
  "Business Name / Sole Proprietorship",
  "Incorporated Trustees",
  "Limited Partnership",
  "Cooperative Society",
];

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "500+"];

export type BusinessInfo = {
  legalName: string;
  tradingName: string;
  industry: string;
  website: string;
  registrationNumber: string;
  yearEstablished: string;
  businessType: string;
  employees: string;
  registeredAddress: string;
  operatingAddress: string;
  sameOperatingAddress: boolean;
  // Not drawn in the Figma, but `CreateBusinessDto` requires both and they are
  // what the business is contacted on - so they are collected rather than
  // silently borrowed from the signed-in user's personal account.
  email: string;
  phone: string;
};

export type DocumentMeta = { name: string; size: number; type: string };

export type Director = {
  id: string;
  name: string;
  role: string;
  ownership: number;
  idStatus: "VERIFIED" | "PENDING";
};

export type KybDraft = {
  /** -1 is the welcome screen; 0-3 are the four form steps. */
  step: number;
  info: BusinessInfo;
  documents: Partial<Record<DocumentKey, DocumentMeta>>;
  directors: Director[];
  confirmed: boolean;
  savedAt: string | null;
};

export function emptyDraft(): KybDraft {
  return {
    step: -1,
    info: {
      legalName: "",
      tradingName: "",
      industry: "",
      website: "",
      registrationNumber: "",
      yearEstablished: "",
      businessType: "",
      employees: "",
      registeredAddress: "",
      operatingAddress: "",
      sameOperatingAddress: true,
      email: "",
      phone: "",
    },
    documents: {},
    directors: [],
    confirmed: false,
    savedAt: null,
  };
}

export function loadDraft(): KybDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<KybDraft>;
    const base = emptyDraft();
    return {
      ...base,
      ...parsed,
      info: { ...base.info, ...(parsed.info ?? {}) },
      documents: parsed.documents ?? {},
      directors: parsed.directors ?? [],
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: KybDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

export function uploadedCount(documents: KybDraft["documents"]) {
  return KYB_DOCUMENTS.filter((d) => documents[d.key]).length;
}

/** Required documents still missing - drives the review step's warning banner. */
export function outstandingDocuments(documents: KybDraft["documents"]) {
  return KYB_DOCUMENTS.filter((d) => d.required && !documents[d.key]);
}

export function totalOwnership(directors: Director[]) {
  return directors.reduce((sum, d) => sum + (Number.isFinite(d.ownership) ? d.ownership : 0), 0);
}

export function isInfoComplete(info: BusinessInfo) {
  return Boolean(
    info.legalName.trim() &&
      info.industry &&
      info.registrationNumber.trim() &&
      info.businessType &&
      info.registeredAddress.trim() &&
      info.email.trim() &&
      info.phone.trim() &&
      (info.sameOperatingAddress || info.operatingAddress.trim())
  );
}

export function fileError(file: File): string | null {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) return `${file.name} is not a PDF, JPG or PNG.`;
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 10MB.`;
  return null;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** "KYB-2025-00892" - derived from the created business so it stays stable. */
export function applicationId(businessId: string, createdAt: string) {
  const year = new Date(createdAt).getFullYear();
  const digits = businessId.replace(/\D/g, "").slice(-5).padStart(5, "0");
  return `KYB-${year}-${digits}`;
}

export function addBusinessDays(from: Date, days: number) {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}
