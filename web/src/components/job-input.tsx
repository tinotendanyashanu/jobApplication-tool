"use client";

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
import type { LocaleCode } from "@/types/profile";

export type JobInputProps = {
  jobDescription: string;
  jobLink: string;
  locale: LocaleCode;
  onJobDescriptionChange: (value: string) => void;
  onJobLinkChange: (value: string) => void;
  onLocaleChange: (value: LocaleCode) => void;
};

export function JobInput({
  jobDescription,
  jobLink,
  locale,
  onJobDescriptionChange,
  onJobLinkChange,
  onLocaleChange,
}: JobInputProps) {
  const counter = `${jobDescription.trim().length}`;

  return (
    <Card className="border-border/80 shadow-xs transition-[box-shadow,border-color] duration-150 hover:border-foreground/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Target role
        </CardTitle>
        <CardDescription>
          Paste the posting text—even rough notes work. Optionally keep the URL for audit later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field
          label="Job description"
          hint={`${counter} characters · aim for verbatim requirements`}
        >
          <Textarea
            rows={12}
            className="min-h-[260px]"
            placeholder="Paste responsibilities, tech stack must-haves, language requirements..."
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
          />
        </Field>
        <Field
          label="Job link (optional)"
          hint="We still rely on pasted text—you can revisit the listing later via this breadcrumb."
        >
          <Input
            placeholder="https://..."
            value={jobLink}
            onChange={(e) => onJobLinkChange(e.target.value)}
          />
        </Field>
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
