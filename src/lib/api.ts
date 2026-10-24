import { API_BASE } from "./constants";
type ApiOptions = RequestInit & { params?: Record<string, string | number | boolean | undefined>; auth?: boolean; skipRedirect?: boolean };
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("vista_business_token", token);
      document.cookie = `vista_business_token=${token}; path=/; max-age=${60*60*24*7}; SameSite=Lax`;
    } else {
      localStorage.removeItem("vista_business_token");
      document.cookie = "vista_business_token=; path=/; max-age=0";
    }
  }
}
export function getAccessToken() {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") return localStorage.getItem("vista_business_token");
  return null;
}
function clearAuthAndRedirect() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("vista_business_token");
    document.cookie = "vista_business_token=; path=/; max-age=0";
    const cur = window.location.pathname;
    if (cur !== "/login" && cur !== "/register" && !cur.startsWith("/verify")) {
      window.location.href = "/login";
    }
  }
}
function buildUrl(path: string, params?: ApiOptions["params"]) {
  const base = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  if (!params) return base;
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") usp.set(k, String(v)); });
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}
export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<{ data: T } & Record<string, unknown>> {
  const { params, auth = true, skipRedirect, headers, ...rest } = opts;
  const url = buildUrl(path, params);
  const token = getAccessToken();
  const res = await fetch(url, { ...rest, headers: { "Content-Type": "application/json", ...(auth && token ? { Authorization: `Bearer ${token}` } : {}), ...(headers as Record<string, string>) } });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && auth && !skipRedirect && !path.includes("/auth/")) { clearAuthAndRedirect(); throw new Error("Unauthorized"); }
  if (!res.ok) { const msg = json?.message ?? json?.error ?? `Request failed (${res.status})`; throw new Error(Array.isArray(msg) ? msg.join(", ") : msg); }
  if (json && typeof json === "object" && "data" in json) return json as { data: T } & Record<string, unknown>;
  return { data: json as T };
}
export const businessApi = {
  register: (body: { email: string; password: string; phone: string; firstName: string; lastName: string }) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body), auth: false }),
  // The API's LoginDto field is `identifier` (email OR phone), and the global
  // ValidationPipe runs with forbidNonWhitelisted, so posting `email` here was
  // rejected as a 400 before it ever reached the handler.
  login: (body: { identifier: string; password: string }) =>
    apiFetch<{ user: unknown; wallet: unknown; tokens: { accessToken: string; refreshToken: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    }),
  verifyOtp: (body: { identifier: string; otp: string; type: string }) => apiFetch("/auth/verify-otp", { method: "POST", body: JSON.stringify(body), auth: false }),
  sendOtp: (body: { identifier: string; type: string }) => apiFetch("/auth/send-otp", { method: "POST", body: JSON.stringify(body), auth: false }),
  me: () => apiFetch("/auth/me"),
  listBusinesses: () => apiFetch("/businesses"),
  getBusiness: (id: string) => apiFetch(`/businesses/${id}`),
  createBusiness: (body: { name: string; email: string; phone: string; registrationNumber?: string; taxId?: string; website?: string }) => apiFetch("/businesses", { method: "POST", body: JSON.stringify(body) }),
  listPaymentLinks: (businessId?: string) =>
    apiFetch<unknown[]>("/payment-links", { params: businessId ? { businessId } : undefined }),
  createPaymentLink: (body: {
    title: string;
    amount?: string;
    currencyCode: string;
    description?: string;
    businessId?: string;
    isFixedAmount?: boolean;
    maxUses?: number;
  }) => apiFetch("/payment-links", { method: "POST", body: JSON.stringify(body) }),
  getPaymentLink: (hashOrId: string) => apiFetch<unknown>(`/payment-links/${hashOrId}`, { auth: false }),
  updatePaymentLink: (
    id: string,
    body: { title?: string; description?: string; isActive?: boolean; amount?: string; expiresAt?: string }
  ) => apiFetch(`/payment-links/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePaymentLink: (id: string) => apiFetch(`/payment-links/${id}`, { method: "DELETE" }),
  payPaymentLink: (hash: string, body: Record<string, unknown>, idempotencyKey: string) =>
    apiFetch(`/payment-links/${hash}/pay`, {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
      headers: { "idempotency-key": idempotencyKey },
    }),
  createInvoice: (body: {
    businessId: string;
    customerName: string;
    customerEmail: string;
    currencyCode: string;
    dueDate: string;
    items: Array<{ description: string; quantity: number; unitPrice: string }>;
  }) => apiFetch("/invoices", { method: "POST", body: JSON.stringify(body) }),
  issueInvoice: (id: string) => apiFetch<{ paymentUrl?: string }>(`/invoices/${id}/issue`, { method: "POST" }),
  getInvoice: (id: string) => apiFetch<unknown>(`/invoices/${id}`),
  getPublicInvoice: (hash: string) => apiFetch<unknown>(`/public/invoices/${hash}`, { auth: false }),
  listRoles: (businessId: string) => apiFetch<unknown[]>(`/businesses/${businessId}/roles`),
  inviteMember: (businessId: string, body: { email: string; roleId: string }) =>
    apiFetch(`/businesses/${businessId}/members`, { method: "POST", body: JSON.stringify(body) }),
  updateMember: (businessId: string, memberId: string, roleId: string) =>
    apiFetch(`/businesses/${businessId}/members/${memberId}`, { method: "PATCH", body: JSON.stringify({ roleId }) }),
  removeMember: (businessId: string, memberId: string) =>
    apiFetch(`/businesses/${businessId}/members/${memberId}`, { method: "DELETE" }),
  listTransactions: (params?: { limit?: number; page?: number; businessId?: string; currencyCode?: string }) =>
    apiFetch<{ items: unknown[]; meta?: { total: number } }>("/transactions", { params }),
  getTransaction: (idOrReference: string) => apiFetch<unknown>(`/transactions/${idOrReference}`),
  // Saved recipients. The API calls them favourites; the portal calls them
  // beneficiaries, which is the term the design and the business use.
  listBeneficiaries: (q?: string) => apiFetch<unknown[]>("/transfers/favorites", { params: q ? { q } : undefined }),
  createBeneficiary: (body: {
    type: "VISTA" | "BANK";
    displayName: string;
    identifier: string;
    vistaTag?: string;
    bankCode?: string;
    bankName?: string;
    accountNumber?: string;
  }) => apiFetch("/transfers/favorites", { method: "POST", body: JSON.stringify(body) }),
  deleteBeneficiary: (id: string) => apiFetch(`/transfers/favorites/${id}`, { method: "DELETE" }),
  listBanks: () => apiFetch<unknown[]>("/withdrawals/banks"),
  getFxRates: () => apiFetch<unknown[]>("/fx/rates"),
  getBusinessStatement: (businessId: string, params?: { from?: string; to?: string }) =>
    apiFetch<{ generatedAt: string; transactions: unknown[] }>(`/reports/businesses/${businessId}/transactions`, {
      params,
    }),
  resolveAccount: (body: { accountNumber: string; bankCode: string }) =>
    apiFetch<{ accountName: string; bankName?: string }>("/withdrawals/resolve-account", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  quoteWithdrawal: (body: { amount: string; currencyCode: string; businessId?: string }) =>
    apiFetch<{ amount?: string; feeAmount?: string; totalDebit?: string }>("/withdrawals/quote", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  initiateWithdrawal: (
    body: {
      amount: string;
      currencyCode: string;
      bankCode: string;
      bankName: string;
      accountNumber: string;
      accountName: string;
      pin: string;
      businessId?: string;
    },
    idempotencyKey: string
  ) =>
    apiFetch("/withdrawals", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "idempotency-key": idempotencyKey },
    }),
  listInvoices: (businessId: string) => apiFetch<unknown[]>("/invoices", { params: { businessId } }),
  getKyc: () => apiFetch("/kyc"),
  submitKyc: (body: Record<string, unknown>) => apiFetch("/kyc/submit", { method: "POST", body: JSON.stringify(body) }),
};
