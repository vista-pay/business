import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "./icons";

type Props = {
  onBack: () => void;
  onSaveDraft: () => void;
  /** The review step draws Save Draft as an outlined button, earlier steps as a link. */
  saveDraftAs?: "link" | "button";
  savedAt: string | null;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  loading?: boolean;
  showArrow?: boolean;
};

export function WizardFooter({
  onBack,
  onSaveDraft,
  saveDraftAs = "link",
  savedAt,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  loading,
  showArrow = true,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
      <button type="button" onClick={onBack} className="text-[15px] text-[#0F172A] hover:underline">
        Back
      </button>

      <div className="flex items-center gap-5">
        {savedAt && <span className="text-xs text-slate-400">Draft saved</span>}
        {saveDraftAs === "link" ? (
          <button type="button" onClick={onSaveDraft} className="text-[15px] font-semibold text-[#2563EB] hover:underline">
            Save Draft
          </button>
        ) : (
          <Button type="button" variant="outline" size="lg" onClick={onSaveDraft}>
            Save Draft
          </Button>
        )}
        <Button
          type="button"
          variant="brand"
          size="lg"
          onClick={onPrimary}
          disabled={primaryDisabled}
          loading={loading}
        >
          {primaryLabel}
          {showArrow && !loading && <ArrowRightIcon className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
