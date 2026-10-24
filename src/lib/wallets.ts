// Currency presentation and portfolio maths for the Wallets screens
// (Figma 41:956, 41:1087, 41:1239).

export type WalletAccountDetail = {
  id: string;
  currencyCode: string;
  availableBalance: string;
  pendingBalance?: string;
  heldBalance?: string;
  isActive?: boolean;
  vanAccountNumber?: string | null;
  vanBankName?: string | null;
  vanAccountName?: string | null;
};

const CURRENCY_META: Record<string, { flag: string; region: string; symbol: string }> = {
  NGN: { flag: "🇳🇬", region: "NG", symbol: "₦" },
  USD: { flag: "🇺🇸", region: "US", symbol: "$" },
  GBP: { flag: "🇬🇧", region: "UK", symbol: "£" },
  EUR: { flag: "🇪🇺", region: "EU", symbol: "€" },
  GHS: { flag: "🇬🇭", region: "GH", symbol: "₵" },
  KES: { flag: "🇰🇪", region: "KE", symbol: "KSh" },
  ZAR: { flag: "🇿🇦", region: "ZA", symbol: "R" },
};

export function currencyMeta(code: string) {
  return CURRENCY_META[code] ?? { flag: "🏳️", region: code.slice(0, 2), symbol: code };
}

/** NGN is written with its code, other currencies with their symbol. */
export function walletMoney(amount: string | number, currency: string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  const value = Number.isFinite(n) ? n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
  if (currency === "NGN") return `NGN ${value}`;
  const { symbol } = currencyMeta(currency);
  return symbol === currency ? `${currency} ${value}` : `${symbol}${value}`;
}

export function signedWalletMoney(amount: string | number, currency: string, credit: boolean) {
  return `${credit ? "+" : "-"}${walletMoney(amount, currency)}`;
}

export function availableOf(a: WalletAccountDetail) {
  return Number(a.availableBalance) || 0;
}
export function pendingOf(a: WalletAccountDetail) {
  return Number(a.pendingBalance) || 0;
}
export function heldOf(a: WalletAccountDetail) {
  return Number(a.heldBalance) || 0;
}

/**
 * Total balance is everything the business owns in the account: spendable,
 * clearing, and reserved against a payout in flight.
 */
export function totalOf(a: WalletAccountDetail) {
  return availableOf(a) + pendingOf(a) + heldOf(a);
}

export type ExchangeRate = {
  baseCurrency: string;
  targetCurrency: string;
  rate: string;
  inverseRate: string;
};

/**
 * Portfolio value in NGN. Currencies with no active rate are reported back
 * rather than silently dropped or counted at face value.
 */
export function portfolioValue(accounts: WalletAccountDetail[], rates: ExchangeRate[]) {
  let total = 0;
  const unconverted: string[] = [];

  for (const account of accounts) {
    const value = totalOf(account);
    if (account.currencyCode === "NGN") {
      total += value;
      continue;
    }
    const direct = rates.find((r) => r.baseCurrency === account.currencyCode && r.targetCurrency === "NGN");
    const inverse = rates.find((r) => r.baseCurrency === "NGN" && r.targetCurrency === account.currencyCode);
    const rate = direct ? Number(direct.rate) : inverse ? Number(inverse.inverseRate) : null;
    if (rate && Number.isFinite(rate)) {
      total += value * rate;
    } else if (value > 0) {
      unconverted.push(account.currencyCode);
    }
  }

  return { total, unconverted };
}

/** NGN is the settlement currency, so it is the primary wallet. */
export function isPrimary(account: WalletAccountDetail, accounts: WalletAccountDetail[]) {
  return account.currencyCode === "NGN" || (accounts.length > 0 && accounts[0].id === account.id && !accounts.some((a) => a.currencyCode === "NGN"));
}

/**
 * NGN leads as the settlement wallet; the rest keep the order the API returned
 * them in. Ranking by balance would compare magnitudes across currencies, which
 * says nothing - £2,000 is not "less" than $3,000.
 */
export function sortAccounts(accounts: WalletAccountDetail[]) {
  return [...accounts].sort((a, b) => {
    if (a.currencyCode === b.currencyCode) return 0;
    if (a.currencyCode === "NGN") return -1;
    if (b.currencyCode === "NGN") return 1;
    return 0;
  });
}
