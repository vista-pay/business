"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { businessApi } from "@/lib/api";
import { PENDING_VERIFICATION_KEY } from "@/lib/auth-flow";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Details = { firstName: string; lastName: string; email: string; phone: string };

/**
 * Figma 00 — Authentication, "create account" (4:770) and "Create password"
 * (213:1260), adapted from the mobile frames into the portal's split panel.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [details, setDetails] = useState<Details>({ firstName: "", lastName: "", email: "", phone: "" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const detailsComplete =
    details.firstName.trim() && details.lastName.trim() && details.email.trim() && details.phone.trim();

  // The API accepts uppercase + lowercase + (number or symbol); the design's
  // checklist is shown as-is, with lowercase folded into the letter-case row so
  // a password that ticks every box always clears server validation too.
  const rules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Upper and lowercase letters", met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const required = rules[0].met && rules[1].met && (rules[2].met || rules[3].met);
  const score = rules.filter((r) => r.met).length;
  const strength = score <= 2 ? "Weak" : score === 3 ? "Medium" : "Strong";
  const canSubmit = required && password === confirm && password.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await businessApi.register({
        firstName: details.firstName.trim(),
        lastName: details.lastName.trim(),
        email: details.email.trim(),
        phone: details.phone.trim(),
        password,
      });
      const verification = (res.data as { verification?: { sentTo?: string; channel?: string; debugOtp?: string } })
        ?.verification;
      sessionStorage.setItem(
        PENDING_VERIFICATION_KEY,
        JSON.stringify({
          identifier: verification?.sentTo ?? details.email.trim(),
          channel: verification?.channel ?? "EMAIL",
          debugOtp: verification?.debugOtp ?? null,
        })
      );
      router.push("/verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create your account. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      headline="Payments for ambitious businesses."
      subhead="Create your Rendi account, verify your identity, then set up your business in minutes."
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>{step === 0 ? "Create Account" : "Create a password"}</CardTitle>
          <CardDescription>
            {step === 0
              ? "Fill in your details to get started."
              : "Choose a strong password you don't use anywhere else."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                setStep(1);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={details.firstName}
                  onChange={(e) => setDetails({ ...details, firstName: e.target.value })}
                  placeholder="Enter your First Name"
                  required
                />
                <Input
                  label="Last Name"
                  value={details.lastName}
                  onChange={(e) => setDetails({ ...details, lastName: e.target.value })}
                  placeholder="Enter your Last Name"
                  required
                />
              </div>
              <Input
                label="E-mail"
                type="email"
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                placeholder="Enter your E-mail"
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={details.phone}
                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                placeholder="+234 801 234 5678"
                required
              />
              <Button type="submit" className="w-full" size="lg" disabled={!detailsComplete}>
                Continue
              </Button>
              <p className="text-center text-xs text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-[#012A9D] hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <Input
                label="Password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Input
                label="Confirm Password"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                error={confirm && confirm !== password ? "Passwords do not match" : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="text-xs font-semibold text-[#012A9D] hover:underline"
              >
                {show ? "HIDE" : "SHOW"} password
              </button>

              <div>
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700">Password Strength</span>
                  <span
                    className={cn(
                      strength === "Strong" ? "text-emerald-600" : strength === "Medium" ? "text-amber-600" : "text-red-600"
                    )}
                  >
                    {password ? strength : "—"}
                  </span>
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full",
                        !password || score <= i
                          ? "bg-slate-200"
                          : strength === "Strong"
                            ? "bg-emerald-500"
                            : strength === "Medium"
                              ? "bg-amber-500"
                              : "bg-red-500"
                      )}
                    />
                  ))}
                </div>
              </div>

              <ul className="space-y-1.5">
                {rules.map((rule) => (
                  <li key={rule.label} className="flex items-center gap-2 text-sm">
                    <span className={cn("text-base leading-none", rule.met ? "text-emerald-600" : "text-slate-300")}>
                      {rule.met ? "✓" : "○"}
                    </span>
                    <span className={rule.met ? "text-slate-700" : "text-slate-500"}>{rule.label}</span>
                  </li>
                ))}
              </ul>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!canSubmit}>
                Continue
              </Button>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="w-full text-center text-sm text-slate-500 hover:underline"
              >
                Back
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
