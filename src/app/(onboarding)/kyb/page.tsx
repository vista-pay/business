"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { businessApi } from "@/lib/api";
import {
  BusinessInfo,
  Director,
  DocumentKey,
  KYB_STEPS,
  KybDraft,
  clearDraft,
  emptyDraft,
  isInfoComplete,
  loadDraft,
  outstandingDocuments,
  saveDraft,
  totalOwnership,
} from "@/lib/kyb";
import { KybStepper } from "@/components/kyb/stepper";
import { KybTopBar } from "@/components/kyb/top-bar";
import { StepBusinessInfo } from "@/components/kyb/step-business-info";
import { StepDirectors } from "@/components/kyb/step-directors";
import { StepDocuments } from "@/components/kyb/step-documents";
import { StepReview } from "@/components/kyb/step-review";
import { StepSubmitted, SubmittedBusiness } from "@/components/kyb/step-submitted";
import { StepWelcome } from "@/components/kyb/step-welcome";
import { WizardFooter } from "@/components/kyb/wizard-footer";

type MeResponse = {
  user?: { email?: string; phone?: string };
  profile?: { firstName?: string; lastName?: string };
};

export default function KybPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<KybDraft>(emptyDraft);
  const [business, setBusiness] = useState<SubmittedBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");

  // Files never leave the browser today (no KYB upload endpoint), so the real
  // File objects live here for the session while only their metadata is drafted.
  const files = useRef<Partial<Record<DocumentKey, File>>>({});

  useEffect(() => {
    let cancelled = false;
    const stored = loadDraft();
    if (stored) setDraft(stored);

    (async () => {
      try {
        const existing = await businessApi.listBusinesses();
        const list = (existing.data as SubmittedBusiness[] | undefined) ?? [];
        if (!cancelled && list.length > 0) {
          setBusiness(list[0]);
          setLoading(false);
          return;
        }
      } catch {
        // An unreachable API shouldn't block onboarding - fall through to the form.
      }

      try {
        const me = await businessApi.me();
        const data = me.data as MeResponse;
        if (!cancelled) {
          setAccountName([data?.profile?.firstName, data?.profile?.lastName].filter(Boolean).join(" "));
          if (data?.user) {
            setDraft((d) => ({
              ...d,
              info: {
                ...d.info,
                email: d.info.email || data.user?.email || "",
                phone: d.info.phone || data.user?.phone || "",
              },
            }));
          }
        }
      } catch {
        // Prefill is a convenience; the fields stay editable either way.
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<KybDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const updateInfo = useCallback(
    (patch: Partial<BusinessInfo>) => setDraft((d) => ({ ...d, info: { ...d.info, ...patch } })),
    []
  );

  const persist = useCallback(
    (next?: Partial<KybDraft>) => {
      const merged = { ...draft, ...next };
      saveDraft(merged);
      setDraft({ ...merged, savedAt: new Date().toISOString() });
    },
    [draft]
  );

  function goTo(step: number) {
    persist({ step });
    window.scrollTo({ top: 0 });
  }

  function handleUpload(key: DocumentKey, file: File) {
    files.current[key] = file;
    update({ documents: { ...draft.documents, [key]: { name: file.name, size: file.size, type: file.type } } });
  }

  function handleRemove(key: DocumentKey) {
    delete files.current[key];
    const next = { ...draft.documents };
    delete next[key];
    update({ documents: next });
  }

  function saveDirector(director: Director) {
    const exists = draft.directors.some((d) => d.id === director.id);
    update({
      directors: exists ? draft.directors.map((d) => (d.id === director.id ? director : d)) : [...draft.directors, director],
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    // Keep the draft on disk so a rejected submission never loses the work.
    saveDraft(draft);
    try {
      const { info } = draft;
      const res = await businessApi.createBusiness({
        name: info.legalName.trim(),
        email: info.email.trim(),
        phone: info.phone.trim(),
        registrationNumber: info.registrationNumber.trim() || undefined,
        website: info.website.trim() || undefined,
      });
      clearDraft();
      setBusiness(res.data as SubmittedBusiness);
      window.scrollTo({ top: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canContinue = useMemo(() => {
    switch (draft.step) {
      case 0:
        return isInfoComplete(draft.info);
      case 1:
        return outstandingDocuments(draft.documents).length === 0;
      case 2:
        return draft.directors.length > 0 && totalOwnership(draft.directors) === 100;
      case 3:
        return draft.confirmed && outstandingDocuments(draft.documents).length === 0 && isInfoComplete(draft.info);
      default:
        return true;
    }
  }, [draft]);

  if (loading) {
    return (
      <>
        <KybTopBar step={null} />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
        </main>
      </>
    );
  }

  if (business) {
    return (
      <>
        <KybTopBar step={null} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
          <StepSubmitted business={business} onDashboard={() => router.push("/overview")} />
        </main>
      </>
    );
  }

  if (draft.step < 0) {
    return (
      <>
        <KybTopBar step={null} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
          <StepWelcome onStart={() => goTo(0)} onSaveLater={() => { persist(); router.push("/overview"); }} />
        </main>
      </>
    );
  }

  return (
    <>
      <KybTopBar step={draft.step} />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <KybStepper step={draft.step} />

        <div className="mx-auto mt-8 w-full max-w-[800px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          {draft.step === 0 && <StepBusinessInfo info={draft.info} onChange={updateInfo} />}
          {draft.step === 1 && (
            <StepDocuments documents={draft.documents} onUpload={handleUpload} onRemove={handleRemove} />
          )}
          {draft.step === 2 && (
            <StepDirectors
              directors={draft.directors}
              onSave={saveDirector}
              onRemove={(id) => update({ directors: draft.directors.filter((d) => d.id !== id) })}
              accountName={accountName}
            />
          )}
          {draft.step === 3 && (
            <StepReview
              draft={draft}
              onEdit={goTo}
              onConfirmChange={(confirmed) => update({ confirmed })}
              error={error}
            />
          )}

          <div className="mt-8">
            <WizardFooter
              onBack={() => goTo(draft.step - 1)}
              onSaveDraft={() => persist()}
              saveDraftAs={draft.step === KYB_STEPS.length - 2 ? "button" : "link"}
              savedAt={draft.savedAt}
              primaryLabel={draft.step === 3 ? "Submit Application" : "Save & Continue"}
              onPrimary={() => (draft.step === 3 ? submit() : goTo(draft.step + 1))}
              primaryDisabled={!canContinue}
              loading={submitting}
              showArrow={draft.step !== 3}
            />
          </div>
        </div>
      </main>
    </>
  );
}
