"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getAccessToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justVerified, setJustVerified] = useState(false);
  useEffect(() => { if (getAccessToken()) router.replace("/overview"); }, [router]);
  useEffect(() => { setJustVerified(new URLSearchParams(window.location.search).get("verified") === "1"); }, []);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try { await login(identifier, password); router.push("/overview"); } catch (err: unknown) { setError(err instanceof Error ? err.message : "Login failed"); } finally { setLoading(false); }
  }
  return (
    <AuthShell
      headline="Payments for ambitious businesses."
      subhead="Collect, pay out, and reconcile — with KYB-verified business wallets."
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader><CardTitle>Business sign in</CardTitle><CardDescription>Use your Rendi personal account (approved KYC required for business).</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {justVerified && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Email verified. Sign in to continue.</div>}
            <Input label="Email or phone" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="you@company.com" />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="text-right">
              <button type="button" className="text-sm font-medium text-slate-600 hover:underline" onClick={() => router.push("/forgot-password")}>
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="w-full" loading={loading} size="lg">Sign in</Button>
            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">New to Rendi?</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => router.push("/register")}>
              Create an account
            </Button>
            <p className="text-center text-xs text-slate-500">You can also register in the Rendi app, then verify KYC.</p>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
