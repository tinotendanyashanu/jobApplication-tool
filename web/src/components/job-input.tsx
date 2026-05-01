"use client";

import { useState } from "react";
import { Loader2, ScanSearch, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { LocaleCode } from "@/types/profile";
import type { ScrapeResult } from "@/types/scrape";

export type JobInputProps = {
  jobDescription: string;
  jobLink: string;
  locale: LocaleCode;
  onJobDescriptionChange: (value: string) => void;
  onJobLinkChange: (value: string) => void;
  onLocaleChange: (value: LocaleCode) => void;
  onScrapeResult?: (result: ScrapeResult) => void;
};

type ScrapeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; method: string }
  | { status: "error"; message: string };

export function JobInput({
  jobDescription,
  jobLink,
  locale,
  onJobDescriptionChange,
  onJobLinkChange,
  onLocaleChange,
  onScrapeResult,
}: JobInputProps) {
  const [scrapeState, setScrapeState] = useState<ScrapeState>({ status: "idle" });

  const counter = `${jobDescription.trim().length}`;

  const canScrape =
    jobLink.trim().startsWith("http") && scrapeState.status !== "loading";

  async function handleScrape() {
    if (!canScrape) return;
    setScrapeState({ status: "loading" });
    try {
      const { scrapeJobUrl } = await import("@/lib/api-scraper");
      const result = await scrapeJobUrl(jobLink.trim());
      if (!result.success || !result.job_description) {
        setScrapeState({
          status: "error",
          message: result.error ?? "Could not extract job description from that URL.",
        });
        return;
      }
      onJobDescriptionChange(result.job_description);
      onScrapeResult?.(result);
      setScrapeState({ status: "success", method: result.method });
    } catch (err) {
      setScrapeState({
        status: "error",
        message: err instanceof Error ? err.message : "Scrape failed.",
      });
    }
  }

  return (
    <Card className="border-border/80 shadow-xs transition-[box-shadow,border-color] duration-150 hover:border-foreground/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Target role
        </CardTitle>
        <CardDescription>
          Paste the posting URL and scrape automatically, or paste the text directly. The link is also saved as an audit breadcrumb.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL + Scrape */}
        <Field
          label="Job link"
          hint="Paste a URL and click Scrape to auto-extract the description."
        >
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="https://boards.greenhouse.io/… or LinkedIn, Indeed…"
              value={jobLink}
              onChange={(e) => {
                onJobLinkChange(e.target.value);
                if (scrapeState.status !== "idle") setScrapeState({ status: "idle" });
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={!canScrape}
              onClick={() => void handleScrape()}
            >
              {scrapeState.status === "loading" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ScanSearch className="size-3.5" />
              )}
              {scrapeState.status === "loading" ? "Scraping…" : "Scrape"}
            </Button>
          </div>

          {/* Status feedback */}
          {scrapeState.status === "success" && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in-0">
              <CheckCircle2 className="size-3.5 shrink-0" />
              Extracted via {methodLabel(scrapeState.method)} — review below before generating.
            </div>
          )}
          {scrapeState.status === "error" && (
            <div className="flex items-start gap-1.5 text-xs text-destructive animate-in fade-in-0">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{scrapeState.message} — try pasting the text manually below.</span>
            </div>
          )}
        </Field>

        {/* Job description textarea */}
        <Field
          label="Job description"
          hint={`${counter} characters · aim for verbatim requirements`}
        >
          <Textarea
            rows={12}
            className="min-h-[260px]"
            placeholder="Paste responsibilities, tech stack must-haves, language requirements… or use Scrape above."
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
          />
        </Field>

        {/* Output language */}
        <Field label="Output language">
          <select
            className="flex h-8 w-full max-w-[200px] rounded-lg border border-input bg-muted/15 px-2 text-sm outline-none ring-offset-background transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            value={locale}
            onChange={(e) => onLocaleChange(e.target.value as LocaleCode)}
          >
            <option value="en">English</option>
            <option value="pl">Polish</option>
          </select>
        </Field>
      </CardContent>
    </Card>
  );
}

function Field(props: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline gap-3">
        <Label className="text-sm">{props.label}</Label>
        {props.hint ? (
          <span className="text-xs text-muted-foreground">{props.hint}</span>
        ) : null}
      </div>
      {props.children}
    </div>
  );
}

function methodLabel(method: string) {
  if (method === "llm_extract") return "AI extraction";
  if (method === "http") return "HTTP scrape";
  return "raw text";
}
