"use client";
import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { businessApi, getAccessToken, setAccessToken } from "@/lib/api";
export const AuthContext = createContext<ReturnType<typeof useAuthState> | null>(null);
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
export function useAuthState() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { setToken(getAccessToken()); setIsLoading(false); }, []);
  // `identifier` accepts an email or a phone number - it is what the API's
  // LoginDto declares. Tokens arrive nested under `tokens`.
  const login = useCallback(async (identifier: string, password: string) => {
    const res = await businessApi.login({ identifier, password });
    const data = res.data as { tokens?: { accessToken: string; refreshToken: string } };
    const tokens = data.tokens;
    if (!tokens?.accessToken) throw new Error("Login did not return a session");
    setAccessToken(tokens.accessToken);
    localStorage.setItem("vista_business_refresh", tokens.refreshToken);
    setToken(tokens.accessToken);
  }, []);
  const logout = useCallback(() => { setAccessToken(null); localStorage.removeItem("vista_business_refresh"); setToken(null); }, []);
  return { token, isAuthenticated: !!token, isLoading, login, logout };
}
