import { redirect } from "next/navigation";

export default async function LegacyInvoicePage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const base = (process.env.NEXT_PUBLIC_PAYMENT_BASE_URL ?? "https://pay.rendi.ng").replace(/\/+$/, "");
  redirect(`${base}/i/${encodeURIComponent(hash)}`);
}
