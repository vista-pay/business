/** Title bar shared by the dashboard's inner pages. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-8 sm:py-6">
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold tracking-tight text-[#0F172A] sm:text-[26px]">{title}</h1>
        {description && <p className="mt-0.5 text-[14px] text-slate-500 sm:text-[15px]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
