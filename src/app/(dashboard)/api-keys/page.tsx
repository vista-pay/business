"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ApiKeysPage() {
  const [businessId, setBusinessId] = useState("");
  const [name, setName] = useState("Primary Key");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await apiFetch(`/businesses/${businessId}/api-keys`, { method: "POST", body: JSON.stringify({ name }) });
      setResult(r.data);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
  }

  return (
    <div className="flex flex-1 flex-col bg-[#F8FAFC]">
      <div className="flex h-[68px] items-center border-b border-slate-200 bg-white px-6">
        <h1 className="text-[18px] font-semibold text-[#0F172A]">API Keys</h1>
      </div>
      <div className="p-6 max-w-2xl">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-[#0F172A]">Create API Key</h3>
          <form onSubmit={create} className="mt-4 space-y-3">
            <input value={businessId} onChange={(e) => setBusinessId(e.target.value)} placeholder="Business ID" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <button type="submit" className="w-full rounded-lg bg-[#012A9D] px-4 py-2 text-sm font-medium text-white">Create Key</button>
          </form>
          {error !== null && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>}
          {result !== null && <pre className="mt-3 max-h-[30vh] overflow-auto rounded-lg bg-slate-50 p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>}
          <p className="mt-3 text-xs text-slate-500">Keep the <code>secret</code> safe — it’s shown only once. Prefix is stored for identification.</p>
        </div>
      </div>
    </div>
  );
}
