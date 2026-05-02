"use client";

import type { LocaleCode } from "@/types/profile";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PreviewPanel } from "@/components/preview-panel";

export type OutputTabsProps = {
  cvText: string | null;
  coverLetterText: string | null;
  loadingCv: boolean;
  loadingLetter: boolean;
  candidateName?: string | null;
  locale: LocaleCode;
  onApply?: () => void;
  applying?: boolean;
};

export function OutputTabs({
  cvText,
  coverLetterText,
  loadingCv,
  loadingLetter,
  candidateName,
  locale,
  onApply,
  applying,
}: OutputTabsProps) {
  const label = sanitizeForFile(candidateName);
  const cvSlug = `${label || "candidate"}-${locale}-cv`;
  const letterSlug = `${label || "candidate"}-${locale}-cover-letter`;

  return (
    <Card className="border-border/80 shadow-xs transition-[box-shadow,border-color] duration-150 hover:border-foreground/10">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Live preview
        </CardTitle>
        <CardDescription>
          Compare drafts side-by-side, copy into ATS forms, or download polished plaintext / PDF snapshots.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="cv">
          <TabsList className="w-full gap-4 bg-muted/35 p-1">
            <TabsTrigger value="cv" className="flex-1 text-sm md:text-[0.95rem]">
              CV preview
            </TabsTrigger>
            <TabsTrigger
              value="letter"
              className="flex-1 text-sm md:text-[0.95rem]"
            >
              Cover letter preview
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="cv"
            className="rounded-b-3xl rounded-t-none pt-6 duration-200 animate-in fade-in-50"
          >
            <PreviewPanel
              title={`${candidateName || "Applicant"} — CV`}
              subtitle="Optimized for scanners and recruiter skim paths"
              body={cvText}
              loading={loadingCv}
              emptyFallback="Run “Generate CV” to stream a recruiter-ready synopsis."
              fileStem={cvSlug}
              onApply={onApply}
              applying={applying}
            />
          </TabsContent>
          <TabsContent
            value="letter"
            className="rounded-b-3xl rounded-t-none pt-6 duration-200 animate-in fade-in-50"
          >
            <PreviewPanel
              title={`${candidateName || "Applicant"} — Cover Letter`}
              subtitle="Narrative that ties requirements to evidenced wins"
              body={coverLetterText}
              loading={loadingLetter}
              emptyFallback="Run “Generate cover letter” once the role context feels complete."
              fileStem={letterSlug}
              onApply={onApply}
              applying={applying}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function sanitizeForFile(raw?: string | null) {
  if (!raw?.trim()) {
    return "";
  }
  return raw
    .normalize("NFKD")
    .replace(/[^\w\s\-]+/g, "")
    .trim()
    .replace(/\s+/g, "_");
}
