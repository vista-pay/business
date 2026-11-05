import { redirect } from "next/navigation";

export default async function LegacyPaymentCompletePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const base = (process.env.NEXT_PUBLIC_PAYMENT_BASE_URL ?? "https://pay.rendi.ng").replace(/\/+$/, "");
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  redirect(`${base}/complete${query.size ? `?${query.toString()}` : ""}`);
}
