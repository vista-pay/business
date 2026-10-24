"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { businessApi } from "@/lib/api";
import { PendingVerification, clearPendingVerification, readPendingVerification } from "@/lib/auth-flow";
import { cn } from "@/lib/utils";
import Link from "next/link";

const LENGTH = 6;
const RESEND_SECONDS = 45;

/** Figma 00 — Authentication, "otp-verification-email" (213:1220). */
export default function VerifyPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [checked, setChecked] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setPending(readPendingVerification());
    setChecked(true);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const code = digits.join("");

  function setDigit(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    if (char && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(LENGTH).fill("");
    pasted.split("").forEach((c, i) => (next[i] = c));
    setDigits(next);
    inputs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setError(null);
    setLoading(true);
    try {
      await businessApi.verifyOtp({ identifier: pending.identifier, otp: code, type: "REGISTRATION" });
      clearPendingVerification();
      router.push("/login?verified=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Incorrect code. Please try again.");
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
      setLoading(false);
    }
  }

  async function resend() {
    if (!pending || countdown > 0) return;
    setError(null);
    try {
      await businessApi.sendOtp({ identifier: pending.identifier, type: "REGISTRATION" });
      setCountdown(RESEND_SECONDS);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not resend the code.");
    }
  }

  return (
    <AuthShell
      headline="Payments for ambitious businesses."
      subhead="Verify your email to activate your Rendi account."
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            {pending
              ? `Enter the 6-digit code sent to ${pending.identifier}`
              : "We could not find a pending verification."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!checked ? null : !pending ? (
            <Link
              href="/register"
              className="block w-full rounded-lg bg-[#012A9D] px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-[#011E7A]"
            >
              Start sign up
            </Link>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div className="flex justify-between gap-2">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    value={digit}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    onPaste={onPaste}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label={`Digit ${i + 1}`}
                    className={cn(
                      "h-14 w-full rounded-xl border bg-white text-center text-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#012A9D]/20",
                      error ? "border-[#EF4444]" : "border-slate-200 focus:border-[#012A9D]"
                    )}
                  />
                ))}
              </div>

              {error && <p className="text-sm font-medium text-[#EF4444]">{error}</p>}

              <p className="text-sm text-slate-500">
                {countdown > 0 ? (
                  <>
                    Resend code in{" "}
                    <span className="font-semibold text-slate-900">
                      00:{String(countdown).padStart(2, "0")}
                    </span>
                  </>
                ) : (
                  <button type="button" onClick={resend} className="font-semibold text-[#012A9D] hover:underline">
                    Resend code
                  </button>
                )}
              </p>

              {pending.debugOtp && (
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
                  Dev only — code from the API: <span className="font-semibold">{pending.debugOtp}</span>
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading} disabled={code.length !== LENGTH}>
                Verify
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
