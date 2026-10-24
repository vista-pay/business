"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { businessApi } from "@/lib/api";

export type WalletAccount = {
  id: string;
  currencyCode: string;
  availableBalance: string;
  pendingBalance?: string;
};

export type Business = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  wallet?: { id: string; accounts?: WalletAccount[] } | null;
};

export type Me = {
  firstName: string;
  lastName: string;
  email: string;
  kycStatus: string;
};

type DashboardState = {
  me: Me | null;
  businesses: Business[];
  /** The business this portal session is acting for - the first one today. */
  business: Business | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const DashboardContext = createContext<DashboardState | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

type MeResponse = {
  user?: { email?: string };
  profile?: { firstName?: string; lastName?: string };
  kyc?: { status?: string };
};

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [meRes, bizRes] = await Promise.allSettled([businessApi.me(), businessApi.listBusinesses()]);

    if (meRes.status === "fulfilled") {
      const data = meRes.value.data as MeResponse;
      setMe({
        firstName: data?.profile?.firstName ?? "",
        lastName: data?.profile?.lastName ?? "",
        email: data?.user?.email ?? "",
        kycStatus: data?.kyc?.status ?? "NOT_STARTED",
      });
    }
    if (bizRes.status === "fulfilled") {
      const list = bizRes.value.data as Business[] | undefined;
      setBusinesses(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <DashboardContext.Provider
      value={{ me, businesses, business: businesses[0] ?? null, loading, refresh }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
