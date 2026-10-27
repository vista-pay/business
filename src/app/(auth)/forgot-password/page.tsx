"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { businessApi } from "@/lib/api";

type Step = "request" | "verify" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await businessApi.forgotPassword(identifier.trim());
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send a reset code");
    } finally {
      setLoading(false);
    }
  }

  async function completeReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await businessApi.resetPassword({ identifier: identifier.trim(), otp: otp.trim(), newPassword: password });
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      headline="Payments for ambitious businesses."
      subhead="Collect, pay out, and reconcile — with KYB-verified business wallets."
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            {step === "request" && "We'll send a one-time code to confirm it's you before anything changes."}
            {step === "verify" && `Enter the 6-digit code sent to ${identifier.trim()} — it expires in 10 minutes.`}
            {step === "done" && "All signed-in sessions were closed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "request" && (
            <form onSubmit={requestCode} className="space-y-4">
              <Input label="Email or phone" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="you@company.com" autoFocus />
              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <Button type="submit" className="w-full" loading={loading} size="lg">Send reset code</Button>
              <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => router.push("/login")}>Back to sign in</Button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={completeReset} className="space-y-4">
              <Input label="Reset code" type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="123456" autoFocus />
              <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              <Input label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="••••••••" />
              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <Button type="submit" className="w-full" loading={loading} size="lg">Set new password</Button>
              <button type="button" className="block w-full text-center text-sm text-slate-500 hover:underline" onClick={() => { setStep("request"); setOtp(""); setError(null); }}>
                Use a different email or phone
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Password updated. Sign in with your new password.
              </div>
              <Button type="button" className="w-full" size="lg" onClick={() => router.push("/login")}>Back to sign in</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
