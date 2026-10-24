import { CheckCircleIcon, WarningIcon } from "./icons";
import {
  KYB_DOCUMENTS,
  KybDraft,
  isInfoComplete,
  outstandingDocuments,
  totalOwnership,
  uploadedCount,
} from "@/lib/kyb";
import { cn } from "@/lib/utils";

type Props = {
  draft: KybDraft;
  onEdit: (step: number) => void;
  onConfirmChange: (confirmed: boolean) => void;
  error: string | null;
};

export function StepReview({ draft, onEdit, onConfirmChange, error }: Props) {
  const { info, documents, directors } = draft;
  const outstanding = outstandingDocuments(documents);
  const uploaded = uploadedCount(documents);
  const allocated = totalOwnership(directors);

  const city = info.registeredAddress.split(",").map((s) => s.trim()).filter(Boolean).at(-2);
  const infoSummary = [info.legalName, info.registrationNumber, info.industry, city].filter(Boolean).join(" · ");
  const documentNames = KYB_DOCUMENTS.map((d) => documents[d.key]?.name).filter(Boolean).join(", ");
  const directorSummary = directors.map((d) => `${d.name} (${d.ownership}%)`).join(", ");

  return (
    <>
      <h1 className="text-[22px] font-bold tracking-tight text-[#0F172A] sm:text-[26px]">Review Your Application</h1>
      <p className="mt-1.5 text-[15px] text-slate-600">
        Carefully check all details before submitting. Incomplete fields must be resolved first.
      </p>

      <hr className="my-6 border-slate-200" />

      <div className="space-y-4">
        <SummaryRow
          ok={isInfoComplete(info)}
          title="Business Information"
          summary={infoSummary || "Not provided yet"}
          onEdit={() => onEdit(0)}
        />
        <SummaryRow
          ok={outstanding.length === 0}
          title="Business Documents"
          summary={`${uploaded} of ${KYB_DOCUMENTS.length} documents uploaded${documentNames ? ` · ${documentNames}` : ""}`}
          onEdit={() => onEdit(1)}
        />
        <SummaryRow
          ok={directors.length > 0 && allocated === 100}
          title="Directors & Beneficial Owners"
          summary={
            directors.length === 0
              ? "No persons added yet"
              : `${directors.length} ${directors.length === 1 ? "person" : "persons"} added · ${directorSummary}`
          }
          onEdit={() => onEdit(2)}
        />
      </div>

      {outstanding.length > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#F59E0B] bg-[#FEF3C7] px-5 py-4">
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]" />
          <div>
            <p className="text-[15px] font-semibold text-[#B45309]">Outstanding Documents Required</p>
            <p className="text-[14px] text-[#B45309]">
              Please upload all required business documents before submitting your application.
            </p>
          </div>
        </div>
      )}

      {error && <SubmitError message={error} />}

      <hr className="my-6 border-slate-200" />

      <label className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-700">
        <input
          type="checkbox"
          checked={draft.confirmed}
          onChange={(e) => onConfirmChange(e.target.checked)}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-slate-300 accent-[#2563EB]"
        />
        I confirm that all information provided is accurate and I am authorized to act on behalf of this business
        entity.
      </label>
    </>
  );
}

/**
 * The API's rejection reasons are terse. The personal-KYC one in particular
 * tells you nothing about what to do next, so expand it into instructions.
 */
function SubmitError({ message }: { message: string }) {
  const needsPersonalKyc = /personal kyc/i.test(message);

  if (!needsPersonalKyc) {
    return <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{message}</div>;
  }

  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-5 py-4">
      <p className="text-[15px] font-semibold text-red-700">Your personal identity check isn&apos;t approved yet</p>
      <p className="mt-1 text-[14px] leading-relaxed text-red-700">
        Rendi verifies the person behind a business before the business itself. Your application is saved as a draft —
        finish identity verification in the Rendi mobile app (Profile → Identity verification), and submit here once it
        is approved. Verification usually completes within a business day.
      </p>
      <p className="mt-2 text-[13px] text-red-600">API said: {message}</p>
    </div>
  );
}

function SummaryRow({
  ok,
  title,
  summary,
  onEdit,
}: {
  ok: boolean;
  title: string;
  summary: string;
  onEdit: () => void;
}) {
  return (
    <section className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          ok ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#FEF3C7] text-[#B45309]"
        )}
      >
        {ok ? <CheckCircleIcon className="h-5 w-5" /> : <WarningIcon className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold text-[#0F172A]">{title}</h3>
        <p className="truncate text-[14px] text-slate-500">{summary}</p>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-[15px] font-semibold text-[#2563EB] hover:underline">
        Edit
      </button>
    </section>
  );
}
