/**
 * Standing page for a sidebar destination whose own Figma frame has not been
 * built yet - keeps the navigation from the dashboard design intact instead of
 * linking to a 404.
 */
export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <>
      <div className="flex h-16 items-center border-b border-slate-200 bg-white px-4 sm:h-[72px] sm:px-8">
        <h1 className="text-[20px] font-bold tracking-tight text-[#0F172A]">{title}</h1>
      </div>
      <div className="p-8">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-[#0F172A]">Not built yet</p>
          <p className="mx-auto mt-1 max-w-md text-[14px] text-slate-500">{description}</p>
        </div>
      </div>
    </>
  );
}
