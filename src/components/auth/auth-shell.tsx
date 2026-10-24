/** Split-panel chrome shared by sign in, sign up and verification. */
export function AuthShell({
  headline,
  subhead,
  children,
}: {
  headline: string;
  subhead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[46%] flex-col justify-between bg-[#012A9D] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <img src="/rendi-brand-symbol.png" alt="Rendi" className="h-10 w-10 rounded-xl" />
          <span className="text-lg font-semibold">Rendi Business</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">{headline}</h1>
          <p className="text-sm text-white/70">{subhead}</p>
        </div>
        <p className="text-xs text-white/50">© Rendi</p>
      </div>
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">{children}</div>
    </div>
  );
}
