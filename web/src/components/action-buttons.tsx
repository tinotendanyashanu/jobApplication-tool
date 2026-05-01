"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ActionButtonsProps = {
  loadingCv: boolean;
  loadingLetter: boolean;
  disabled: boolean;
  onGenerateCv: () => void;
  onGenerateCoverLetter: () => void;
};

export function ActionButtons({
  loadingCv,
  loadingLetter,
  disabled,
  onGenerateCv,
  onGenerateCoverLetter,
}: ActionButtonsProps) {
  const busyBoth = loadingCv && loadingLetter;
  const showInlineHint =
    loadingCv !== loadingLetter &&
    Boolean(loadingCv || loadingLetter) &&
    !busyBoth;

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-border/70 bg-muted/15 p-4">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          className="min-w-[164px]"
          disabled={disabled || loadingCv}
          onClick={onGenerateCv}
        >
          {loadingCv ? (
            <>
              <Loader2 className="animate-spin" />
              Drafting CV…
            </>
          ) : (
            <>
              <Sparkles />
              Generate CV
            </>
          )}
        </Button>
        <Button
          type="button"
          className="min-w-[228px]"
          disabled={disabled || loadingLetter}
          onClick={onGenerateCoverLetter}
        >
          {loadingLetter ? (
            <>
              <Loader2 className="animate-spin" />
              Drafting letter…
            </>
          ) : (
            <>
              <Sparkles />
              Generate cover letter
            </>
          )}
        </Button>
      </div>
      <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
        Each draft calls the backing model independently so you can iterate on one artifact without overwriting the other.
      </p>
      {busyBoth ? (
        <div className="flex items-center gap-2 rounded-lg bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-inner">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Running both generations in parallel—expect two API calls shortly.
        </div>
      ) : null}
      {showInlineHint ? (
        <p className="text-xs leading-relaxed text-muted-foreground animate-in fade-in-0 zoom-in-95">
          Heads up—you can tweak language or reorder bullets while waiting; just avoid refreshing the page mid-flight.
        </p>
      ) : null}
    </div>
  );
}
