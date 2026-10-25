"use client";
import { useCallback, useEffect, useState } from "react";
import { BusinessSettings, SettlementAccount, businessApi } from "@/lib/api";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Modal } from "@/components/dashboard/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const BUSINESS_TYPES = ["Limited Liability Company", "Sole Proprietorship", "Partnership", "Public Limited Company", "NGO / Non-profit"];
const INDUSTRIES = ["Financial Technology", "Retail & Commerce", "Agriculture", "Logistics", "Hospitality", "Education", "Healthcare", "Media & Entertainment", "Other"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-baseline gap-4 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</span>
      <span className="text-[14px] font-semibold text-[#0F172A]">{children}</span>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#2563EB]" : "bg-slate-300"} disabled:opacity-50`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

type BusinessRecord = { id: string; name: string; registrationNumber?: string | null; businessType?: string | null; industry?: string | null; address?: string | null; city?: string | null; state?: string | null; country?: string; phone?: string; email?: string };

export default function SettingsPage() {
  const { business, refresh } = useDashboard() as { business: BusinessRecord | null; refresh: () => Promise<void> };
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [modal, setModal] = useState<"profile" | "banking" | "security" | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    if (!business) return;
    try {
      const [s, a] = await Promise.all([
        businessApi.getBusinessSettings(business.id),
        businessApi.listSettlementAccounts(business.id),
      ]);
      setSettings(s.data);
      setAccounts(a.data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load settings");
    }
  }, [business]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3000); return () => clearTimeout(t); }, [toast]);

  async function patchSettings(partial: Partial<BusinessSettings>) {
    if (!business || !settings) return;
    const previous = settings;
    setSettings({ ...settings, ...partial });
    try {
      const res = await businessApi.updateBusinessSettings(business.id, partial);
      setSettings(res.data);
    } catch (e) {
      setSettings(previous);
      setError(e instanceof Error ? e.message : "Could not save");
    }
  }

  const address = business
    ? [business.address, business.city, business.state, business.country === "NGA" ? "Nigeria" : business.country].filter(Boolean).join(", ")
    : "";
  const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];

  const notificationRows: Array<{ key: keyof BusinessSettings; label: string }> = [
    { key: "emailNotifications", label: "Email Notifications" },
    { key: "paymentAlerts", label: "Payment Alerts" },
    { key: "dailySummary", label: "Daily Summary" },
    { key: "weeklyReports", label: "Weekly Reports" },
    { key: "smsAlerts", label: "SMS Alerts" },
  ];

  return (
    <main className="flex-1 bg-[#F8FAFC]">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
        <h1 className="text-[26px] font-bold tracking-tight text-[#0F172A]">Business Settings</h1>
        <hr className="mt-6 border-slate-200" />
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            {/* Business Profile */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-[17px] font-bold text-[#0F172A]">Business Profile</h2>
                <button onClick={() => setModal("profile")} className="text-sm font-semibold text-[#2563EB]">Edit Profile</button>
              </div>
              <div className="mt-2 divide-y divide-slate-50">
                <Row label="Business Name">{business?.name ?? "—"}</Row>
                <Row label="Registration Number">{business?.registrationNumber ?? <span className="font-normal text-slate-400">Not provided</span>}</Row>
                <Row label="Business Type">{business?.businessType ?? <span className="font-normal text-slate-400">Not set</span>}</Row>
                <Row label="Industry">{business?.industry ?? <span className="font-normal text-slate-400">Not set</span>}</Row>
                <Row label="Address">{address || <span className="font-normal text-slate-400">Not set</span>}</Row>
              </div>
            </section>

            {/* Banking & Payout */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-[17px] font-bold text-[#0F172A]">Banking &amp; Payout</h2>
                <button onClick={() => setModal("banking")} className="text-sm font-semibold text-[#2563EB]">Manage</button>
              </div>
              <div className="mt-2 divide-y divide-slate-50">
                <Row label="Default Account">
                  {defaultAccount ? `${defaultAccount.bankName} ••••${defaultAccount.accountNumber.slice(-4)}` : <span className="font-normal text-slate-400">No account added</span>}
                </Row>
                <Row label="Auto Payout">
                  {settings?.autoPayoutEnabled ? `Enabled — Daily at ${settings.autoPayoutTime ?? "18:00"}` : <span className="font-normal text-slate-500">Disabled</span>}
                </Row>
                <Row label="Payout Threshold">
                  {settings?.payoutThreshold ? `${settings.payoutCurrency} ${Number(settings.payoutThreshold).toLocaleString()}` : <span className="font-normal text-slate-400">Not set</span>}
                </Row>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            {/* Notification Preferences */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="border-b border-slate-100 pb-4 text-[17px] font-bold text-[#0F172A]">Notification Preferences</h2>
              <div className="mt-2">
                {notificationRows.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-2.5">
                    <span className="text-[14px] font-medium text-[#0F172A]">{label}</span>
                    <Toggle
                      checked={Boolean(settings?.[key])}
                      disabled={!settings}
                      onChange={(v) => void patchSettings({ [key]: v } as Partial<BusinessSettings>)}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Security */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-[17px] font-bold text-[#0F172A]">Security</h2>
                <button onClick={() => setModal("security")} className="text-sm font-semibold text-[#2563EB]">Security Settings</button>
              </div>
              <div className="mt-2 divide-y divide-slate-50">
                <Row label="Two-Factor Auth">{settings?.twoFactorAuth ? "Enabled ✓" : <span className="font-normal text-slate-500">Not enabled</span>}</Row>
                <Row label="IP Whitelisting">{settings ? `${settings.ipWhitelist.length} IP${settings.ipWhitelist.length === 1 ? "" : "s"} configured` : "—"}</Row>
                <Row label="Session Timeout">{settings ? `${settings.sessionTimeoutMinutes} minutes` : "—"}</Row>
              </div>
            </section>
          </div>
        </div>
      </div>

      {modal === "profile" && business && (
        <ProfileModal business={business} onClose={() => setModal(null)} onSaved={async () => { setModal(null); setToast("Business profile updated."); await refresh(); }} />
      )}
      {modal === "banking" && business && settings && (
        <BankingModal businessId={business.id} settings={settings} accounts={accounts} onClose={() => setModal(null)} onChanged={async () => { setToast("Banking & payout updated."); await load(); }} />
      )}
      {modal === "security" && business && settings && (
        <SecurityModal settings={settings} onClose={() => setModal(null)} onSave={async (partial) => { await patchSettings(partial); setModal(null); setToast("Security settings updated."); }} />
      )}
      {toast && <div className="fixed bottom-5 right-5 z-[90] rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-xl">✓ {toast}</div>}
    </main>
  );
}

function ProfileModal({ business, onClose, onSaved }: { business: BusinessRecord; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({
    name: business.name ?? "", registrationNumber: business.registrationNumber ?? "",
    businessType: business.businessType ?? "", industry: business.industry ?? "",
    address: business.address ?? "", city: business.city ?? "", state: business.state ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true); setError("");
    try {
      await businessApi.updateBusiness(business.id, { ...form });
      await onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save profile"); }
    finally { setBusy(false); }
  }
  return (
    <Modal title="Edit business profile" onClose={onClose} width="max-w-[560px]">
      <div className="space-y-4 p-6">
        <Input label="Business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Registration number" placeholder="RC-1234567" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
          <Select label="Business type" options={BUSINESS_TYPES} placeholder="Select type" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
        </div>
        <Select label="Industry" options={INDUSTRIES} placeholder="Select industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
        <Input label="Street address" placeholder="15 Broad Street, Lagos Island" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={busy} disabled={form.name.trim().length < 2}>Save changes</Button>
        </div>
      </div>
    </Modal>
  );
}

function BankingModal({ businessId, settings, accounts, onClose, onChanged }: { businessId: string; settings: BusinessSettings; accounts: SettlementAccount[]; onClose: () => void; onChanged: () => Promise<void> }) {
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);
  const [form, setForm] = useState({ bankCode: "", accountNumber: "", accountName: "" });
  const [payout, setPayout] = useState({ autoPayoutEnabled: settings.autoPayoutEnabled, autoPayoutTime: settings.autoPayoutTime ?? "18:00", payoutThreshold: settings.payoutThreshold ?? "" });
  const [resolving, setResolving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    businessApi.listBanks().then((r) => setBanks((r.data as Array<{ code: string; name: string }>) ?? [])).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (form.accountNumber.length === 10 && form.bankCode) {
      setResolving(true);
      businessApi.resolveAccount({ accountNumber: form.accountNumber, bankCode: form.bankCode })
        .then((r) => setForm((f) => ({ ...f, accountName: r.data.accountName })))
        .catch(() => setError("Could not verify that account number"))
        .finally(() => setResolving(false));
    }
  }, [form.accountNumber, form.bankCode]);

  async function addAccount() {
    const bank = banks.find((b) => b.code === form.bankCode);
    if (!bank || !form.accountName) return;
    setBusy(true); setError("");
    try {
      await businessApi.addSettlementAccount(businessId, { bankName: bank.name, bankCode: bank.code, accountNumber: form.accountNumber, accountName: form.accountName });
      setForm({ bankCode: "", accountNumber: "", accountName: "" });
      await onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add account"); }
    finally { setBusy(false); }
  }

  async function savePayout() {
    setBusy(true); setError("");
    try {
      await businessApi.updateBusinessSettings(businessId, {
        autoPayoutEnabled: payout.autoPayoutEnabled,
        autoPayoutTime: payout.autoPayoutTime,
        ...(payout.payoutThreshold ? { payoutThreshold: payout.payoutThreshold } : {}),
      } as Partial<BusinessSettings>);
      await onChanged();
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save payout settings"); }
    finally { setBusy(false); }
  }

  return (
    <Modal title="Banking & payout" onClose={onClose} width="max-w-[560px]">
      <div className="space-y-5 p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Settlement accounts</p>
          <div className="mt-2 space-y-2">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div><b className="block text-sm">{a.bankName} ••••{a.accountNumber.slice(-4)}</b><span className="text-xs text-slate-500">{a.accountName}</span></div>
                <div className="flex items-center gap-2">
                  {a.isDefault ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">Default</span>
                    : <button onClick={() => businessApi.makeSettlementAccountDefault(businessId, a.id).then(onChanged)} className="text-xs font-semibold text-[#2563EB]">Make default</button>}
                  <button onClick={() => businessApi.removeSettlementAccount(businessId, a.id).then(onChanged)} className="text-xs font-semibold text-red-500">Remove</button>
                </div>
              </div>
            ))}
            {!accounts.length && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No settlement account yet — add one below.</p>}
          </div>
          <div className="mt-3 grid gap-3">
            <Select label="Bank" placeholder="Select bank" options={banks.map((b) => b.name)} value={banks.find((b) => b.code === form.bankCode)?.name ?? ""} onChange={(e) => setForm({ ...form, bankCode: banks.find((b) => b.name === e.target.value)?.code ?? "", accountName: "" })} />
            <Input label="Account number" maxLength={10} inputMode="numeric" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, ""), accountName: "" })} hint={resolving ? "Verifying…" : form.accountName ? `✓ ${form.accountName}` : undefined} />
            <Button variant="secondary" onClick={addAccount} loading={busy} disabled={!form.accountName}>Add account</Button>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Automatic payout</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-medium">Auto payout</span>
            <Toggle checked={payout.autoPayoutEnabled} onChange={(v) => setPayout({ ...payout, autoPayoutEnabled: v })} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Payout time (daily)" type="time" value={payout.autoPayoutTime} onChange={(e) => setPayout({ ...payout, autoPayoutTime: e.target.value })} disabled={!payout.autoPayoutEnabled} />
            <Input label={`Threshold (${settings.payoutCurrency})`} inputMode="numeric" placeholder="100000" value={payout.payoutThreshold ?? ""} onChange={(e) => setPayout({ ...payout, payoutThreshold: e.target.value.replace(/[^\d.]/g, "") })} />
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={savePayout} loading={busy}>Save payout settings</Button>
        </div>
      </div>
    </Modal>
  );
}

function SecurityModal({ settings, onClose, onSave }: { settings: BusinessSettings; onClose: () => void; onSave: (p: Partial<BusinessSettings>) => Promise<void> }) {
  const [twoFactorAuth, setTwoFactorAuth] = useState(settings.twoFactorAuth);
  const [ips, setIps] = useState(settings.ipWhitelist.join("\n"));
  const [timeout_, setTimeout_] = useState(String(settings.sessionTimeoutMinutes));
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    const ipWhitelist = ips.split("\n").map((x) => x.trim()).filter(Boolean);
    await onSave({ twoFactorAuth, ipWhitelist, sessionTimeoutMinutes: Math.min(240, Math.max(5, Number(timeout_) || 30)) });
    setBusy(false);
  }
  return (
    <Modal title="Security settings" onClose={onClose} width="max-w-[520px]">
      <div className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div><b className="block text-sm">Two-factor authentication</b><span className="text-xs text-slate-500">Require an email code at sign-in.</span></div>
          <Toggle checked={twoFactorAuth} onChange={setTwoFactorAuth} />
        </div>
        <div>
          <label className="text-sm font-medium text-[#0F172A]">IP whitelist <span className="font-normal text-slate-400">(one per line, empty = allow all)</span></label>
          <textarea rows={4} value={ips} onChange={(e) => setIps(e.target.value)} placeholder={"102.89.1.14\n197.210.0.0/16"} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100" />
        </div>
        <Input label="Session timeout (minutes)" inputMode="numeric" value={timeout_} onChange={(e) => setTimeout_(e.target.value.replace(/\D/g, ""))} hint="Between 5 and 240 minutes" />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={busy}>Save security settings</Button>
        </div>
      </div>
    </Modal>
  );
}
