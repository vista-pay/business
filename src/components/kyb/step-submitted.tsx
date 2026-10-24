import { Button } from "@/components/ui/button";
import { CheckIcon } from "./icons";
import { addBusinessDays, applicationId } from "@/lib/kyb";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type SubmittedBusiness = {
  id: string;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Under Review", className: "bg-[#FEF3C7] text-[#B45309]" },
  APPROVED: { label: "Approved", className: "bg-[#DCFCE7] text-[#15803D]" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" },
};

function dateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function dateOnly(value: string | Date) {
  return new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function StepSubmitted({ business, onDashboard }: { business: SubmittedBusiness; onDashboard: () => void }) {
  const status = STATUS_LABELS[business.status] ?? STATUS_LABELS.PENDING;
  const submittedAt = dateTime(business.createdAt);
  const estimated = addBusinessDays(new Date(business.createdAt), 3);

  const approved = business.status === "APPROVED";
  const timeline = [
    { title: "Application Submitted", detail: submittedAt, state: "done" as const },
    {
      title: "Document Review",
      detail: approved ? "Completed" : `Estimated completion: ${dateOnly(estimated)}`,
      state: approved ? ("done" as const) : ("current" as const),
    },
    {
      title: "Compliance Check",
      detail: approved ? "Completed" : "Awaiting preceding step",
      state: approved ? ("done" as const) : ("pending" as const),
    },
    {
      title: "Verification Complete",
      detail: approved ? "Your business is verified" : "Awaiting preceding step",
      state: approved ? ("done" as const) : ("pending" as const),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[640px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF]">
          <CheckIcon className="h-7 w-7 text-[#2563EB]" strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 text-[24px] font-bold tracking-tight text-[#0F172A] sm:text-[28px]">Application Submitted</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
          Your business verification is under review. This typically takes 1-3 business days. We will notify you by
          email when complete.
        </p>
      </div>

      <hr className="my-7 border-slate-200" />

      <dl className="space-y-3 rounded-xl border border-slate-200 bg-[#F8FAFC] px-5 py-4 text-[15px]">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Application ID</dt>
          <dd className="font-semibold text-[#0F172A]">{applicationId(business.id, business.createdAt)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Submitted</dt>
          <dd className="font-semibold text-[#0F172A]">{submittedAt}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Status</dt>
          <dd>
            <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-semibold", status.className)}>
              {status.label}
            </span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500">Estimated Completion</dt>
          <dd className="font-semibold text-[#2563EB]">{dateOnly(estimated)}</dd>
        </div>
      </dl>

      <h2 className="mt-7 text-[13px] font-bold uppercase tracking-[0.04em] text-[#0F172A]">
        Verification Process Timeline
      </h2>
      <ol className="mt-4">
        {timeline.map((item, i) => (
          <li key={item.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              {item.state === "done" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFCE7]">
                  <CheckIcon className="h-3 w-3 text-[#16A34A]" strokeWidth={3} />
                </span>
              ) : item.state === "current" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#2563EB] bg-white">
                  <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                </span>
              ) : (
                <span className="h-5 w-5 rounded-full border-2 border-slate-200 bg-white" />
              )}
              {i < timeline.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
            </div>
            <div className={cn("pb-6", i === timeline.length - 1 && "pb-0")}>
              <p className="text-[15px] font-semibold text-[#0F172A]">{item.title}</p>
              <p className="text-[13px] text-slate-500">{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <hr className="my-7 border-slate-200" />

      <Button variant="brand" size="lg" onClick={onDashboard} className="w-full">
        Go to Dashboard
      </Button>
      <Link
        href="/settings"
        className="mt-4 block text-center text-[15px] font-semibold text-[#2563EB] hover:underline"
      >
        Contact Support
      </Link>
    </div>
  );
}
