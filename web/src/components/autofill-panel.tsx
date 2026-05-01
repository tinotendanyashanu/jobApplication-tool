"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, ClipboardCopy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AutofillField, AutofillResponse } from "@/types/scrape";

export type AutofillPanelProps = {
  data: AutofillResponse | null;
  loading: boolean;
  onRequest: () => void;
  canRequest: boolean;
};

const CATEGORY_ORDER = ["contact", "links", "professional", "experience", "preferences", "documents"];
const CATEGORY_LABELS: Record<string, string> = {
  contact: "Contact details",
  links: "Online profiles",
  professional: "Professional",
  experience: "Experience",
  preferences: "Preferences",
  documents: "Documents (CV & Cover Letter)",
};

export function AutofillPanel({ data, loading, onRequest, canRequest }: AutofillPanelProps) {
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set(["documents"]));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function toggleCat(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  async function copyToClipboard(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!data && !loading) {
    return (
      <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/15 p-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold leading-tight tracking-tight">Application autofill</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Generate a pre-filled field map from your profile — copy values directly into any ATS form with one click. Works best after generating both documents.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={!canRequest}
          onClick={onRequest}
        >
          <ClipboardCopy className="size-3.5" />
          Prepare autofill data
        </Button>
        {!canRequest && (
          <p className="text-xs text-muted-foreground">
            Generate a CV and cover letter first so the autofill includes those document texts.
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/15 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Building autofill map…
      </div>
    );
  }

  if (!data) return null;

  const grouped = groupByCategory(data.fields);

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight">
              Application autofill
            </CardTitle>
            <CardDescription className="text-xs">
              {data.fields.length} fields ready · click any row to copy · use these on any application form
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.years_of_experience != null && (
              <Badge variant="muted" className="text-xs">
                ~{data.years_of_experience} yr{data.years_of_experience !== 1 ? "s" : ""} exp
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {CATEGORY_ORDER.map((cat) => {
          const fields = grouped[cat];
          if (!fields?.length) return null;
          const collapsed = collapsedCats.has(cat);

          return (
            <div key={cat} className="rounded-xl border border-border/60 overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/25 hover:bg-muted/40 transition-colors"
                onClick={() => toggleCat(cat)}
              >
                {CATEGORY_LABELS[cat] ?? cat}
                {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
              </button>

              {!collapsed && (
                <ul className="divide-y divide-border/40">
                  {fields.map((field) => (
                    <FieldRow
                      key={field.key}
                      field={field}
                      copied={copiedKey === field.key}
                      onCopy={() => void copyToClipboard(field.key, field.value)}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        <p className="text-[0.7rem] leading-relaxed text-muted-foreground pt-1">
          Values sourced strictly from your profile — nothing fabricated. Refresh after editing your profile or regenerating documents.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={onRequest}
        >
          Refresh autofill data
        </Button>
      </CardContent>
    </Card>
  );
}

function FieldRow({
  field,
  copied,
  onCopy,
}: {
  field: AutofillField;
  copied: boolean;
  onCopy: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = field.value.length > 180;
  const displayValue = isLong && !expanded ? field.value.slice(0, 180) + "…" : field.value;

  return (
    <li className="group flex items-start gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors">
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {field.label}
        </p>
        <p className="break-words text-xs leading-relaxed text-foreground">
          {displayValue}
        </p>
        {isLong && (
          <button
            type="button"
            className="text-[0.68rem] text-primary underline-offset-2 hover:underline"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : "Show all"}
          </button>
        )}
        {field.hint && (
          <p className="text-[0.68rem] text-muted-foreground">{field.hint}</p>
        )}
      </div>
      <button
        type="button"
        aria-label={`Copy ${field.label}`}
        className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        onClick={onCopy}
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </li>
  );
}

function groupByCategory(fields: AutofillField[]): Record<string, AutofillField[]> {
  const groups: Record<string, AutofillField[]> = {};
  for (const f of fields) {
    (groups[f.category] ??= []).push(f);
  }
  return groups;
}
