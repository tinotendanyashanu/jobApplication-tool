"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";

import type { ApplicationRecord } from "@/types/application";
import type { ApplicationOutcome } from "@/types/prediction";
import { submitApplicationFeedback } from "@/lib/api-prediction";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMediumDate } from "@/components/applications/date-format";
import { STATUS_LABELS, statusBadgeVariant } from "@/components/applications/status-helpers";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const OUTCOME_OPTIONS: { value: ApplicationOutcome; label: string }[] = [
  { value: "response", label: "Recruiter / hiring response" },
  { value: "interview", label: "Interview process" },
  { value: "rejected", label: "Formal rejection" },
  { value: "none", label: "Ghosted / unclear" },
];

export type ApplicationDetailDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  application: ApplicationRecord | null;
  userId: string;
  onApplicationPatched?: (row: ApplicationRecord) => void;
};

export function ApplicationDetailDialog({
  open,
  onOpenChange,
  application,
  userId,
  onApplicationPatched,
}: ApplicationDetailDialogProps) {
  const rows = application;

  const [outcomeDraft, setOutcomeDraft] = useState<ApplicationOutcome>("none");
  const [daysDraft, setDaysDraft] = useState<string>("");
  const [savingFb, setSavingFb] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (!rows?.outcome) {
      setOutcomeDraft("none");
    } else {
      setOutcomeDraft(rows.outcome as ApplicationOutcome);
    }
    if (rows?.response_time_days != null && rows.response_time_days >= 0) {
      setDaysDraft(String(rows.response_time_days));
    } else {
      setDaysDraft("");
    }
    setFeedbackError(null);
  }, [rows]);

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!rows) return;
    setSavingFb(true);
    setFeedbackError(null);
    try {
      let days: number | null = null;
      if (daysDraft.trim() !== "") {
        const parsed = Number.parseInt(daysDraft.trim(), 10);
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error("Response time must be a non-negative integer (days).");
        }
        days = parsed;
      }
      const updated = await submitApplicationFeedback(userId, {
        application_id: rows.id,
        outcome: outcomeDraft,
        response_time_days: days,
      });
      onApplicationPatched?.(updated);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Feedback save failed.");
    } finally {
      setSavingFb(false);
    }
  }

  function confidenceSentence(level: ApplicationRecord["confidence_level"]) {
    if (level === "high") return "Inputs were complete enough for a tighter uncertainty band.";
    if (level === "medium") return "Some cues were inferred — widen your mental confidence interval.";
    if (level === "low") return "Sparse cues — interpret the headline number cautiously.";
    return "Awaiting persisted confidence metadata.";
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 isolate bg-black/45 backdrop-blur-sm transition-opacity duration-150",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed inset-0 z-50 isolate flex items-start justify-center overflow-y-auto p-4 outline-none md:p-12",
            "pointer-events-none"
          )}
          initialFocus
        >
          <div className="relative mx-auto mt-12 w-full max-w-5xl rounded-3xl border border-border/75 bg-background/98 p-6 shadow-2xl pointer-events-auto md:p-10">
            <Dialog.Close
              type="button"
              className={cn(
                "absolute top-5 right-5 inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/55"
              )}
            >
              Close
            </Dialog.Close>

            {!rows ? (
              <p className="text-sm text-muted-foreground">No application loaded.</p>
            ) : (
              <div className="space-y-6">
                <header className="space-y-3 pr-28">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                      Application dossier
                    </p>
                    <Badge variant={statusBadgeVariant(rows.status)}>
                      {STATUS_LABELS[rows.status]}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Dialog.Title className="text-pretty text-3xl font-semibold tracking-tight">
                      {rows.job_title}
                    </Dialog.Title>
                    <Dialog.Description className="text-base text-muted-foreground">
                      {rows.company}
                    </Dialog.Description>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Applied {formatMediumDate(rows.applied_at)} · Created {formatMediumDate(rows.created_at)}
                  </p>
                </header>

                <Tabs key={rows.id} defaultValue="job" className="gap-4">
                  <TabsList variant="line" className="w-full flex-wrap justify-start">
                    <TabsTrigger value="job">Posting</TabsTrigger>
                    <TabsTrigger value="cv">CV</TabsTrigger>
                    <TabsTrigger value="letter">Cover letter</TabsTrigger>
                    <TabsTrigger value="insights">Match insights</TabsTrigger>
                    <TabsTrigger value="response">Response outlook</TabsTrigger>
                  </TabsList>

                  <TabsContent value="job" className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                    <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                      {rows.job_description}
                    </pre>
                  </TabsContent>

                  <TabsContent value="cv" className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                    <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                      {rows.cv_text || "No CV captured for this snapshot."}
                    </pre>
                  </TabsContent>

                  <TabsContent value="letter" className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                    <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                      {rows.cover_letter_text || "No cover letter captured for this snapshot."}
                    </pre>
                  </TabsContent>

                  <TabsContent value="insights" className="space-y-4 rounded-2xl border border-border/70 bg-muted/15 p-4">
                    <div className="grid gap-4 text-sm md:grid-cols-4">
                      <Metric label="Match" value={`${rows.match_score ?? "—"}${typeof rows.match_score === "number" ? "/100" : ""}`} />
                      <Metric label="Skill match" value={rows.skill_match != null ? `${rows.skill_match}/100` : "—"} />
                      <Metric
                        label="Experience match"
                        value={rows.experience_match != null ? `${rows.experience_match}/100` : "—"}
                      />
                      <Metric label="Keyword match" value={rows.keyword_match != null ? `${rows.keyword_match}/100` : "—"} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <ListBlock title="Strengths" items={rows.strengths} empty="Strengths unavailable for this snapshot." />
                      <ListBlock title="Gaps / risks" items={rows.gaps} empty="Gaps unavailable for this snapshot." />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="response"
                    className="space-y-5 rounded-2xl border border-border/70 bg-muted/15 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <Metric
                        label="Response outlook"
                        value={
                          typeof rows.response_probability === "number"
                            ? `${rows.response_probability}/100 band`
                            : "—"
                        }
                      />
                      <Metric label="Confidence" value={rows.confidence_level ?? "—"} />
                      <Metric
                        label="Logged hiring signal"
                        value={
                          rows.outcome
                            ? OUTCOME_OPTIONS.find((o) => o.value === rows.outcome)?.label ?? rows.outcome
                            : "—"
                        }
                      />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      This headline number blends Phase&nbsp;3 overlaps with freshness and coarse competition guesses.
                      {" "}
                      {confidenceSentence(rows.confidence_level ?? null)}
                    </p>

                    <form className="space-y-4 border-t border-border/60 pt-4" onSubmit={(e) => void submitFeedback(e)}>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Ground truth (Phase 5 feedback loop)
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`feedback-outcome-${rows.id}`} className="text-xs font-semibold text-foreground">
                            Outcome snapshot
                          </Label>
                          <select
                            id={`feedback-outcome-${rows.id}`}
                            value={outcomeDraft}
                            onChange={(ev) => setOutcomeDraft(ev.target.value as ApplicationOutcome)}
                            disabled={savingFb}
                            className={cn(
                              "flex h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors",
                              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                            )}
                          >
                            {OUTCOME_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`feedback-days-${rows.id}`} className="text-xs font-semibold text-foreground">
                            Days to signal (optional)
                          </Label>
                          <Input
                            id={`feedback-days-${rows.id}`}
                            inputMode="numeric"
                            type="number"
                            min={0}
                            placeholder="e.g. 9"
                            value={daysDraft}
                            onChange={(ev) => setDaysDraft(ev.target.value)}
                            disabled={savingFb}
                          />
                        </div>
                      </div>
                      {feedbackError ? (
                        <p className="text-sm text-destructive">{feedbackError}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" size="sm" disabled={savingFb}>
                          {savingFb ? "Saving outcome…" : "Save recruiter outcome"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Powers future calibration once enough rows accumulate.
                        </p>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>

                <footer className="flex justify-between gap-4 border-t border-border/65 pt-4">
                  <p className="text-xs text-muted-foreground">
                    Stored fields mirror your FastAPI + Postgres tracker; rerun Workspace saves to attach fresher outlook
                    snapshots.
                  </p>
                  <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
                    Done
                  </Button>
                </footer>
              </div>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/90 px-3 py-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm">{value}</p>
    </div>
  );
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/90">
          {items.map((item, idx) => (
            <li key={`${title}-${idx}-${item.slice(0, 24)}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
