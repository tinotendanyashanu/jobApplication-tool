"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardCheck, ChevronDown } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { JobInput } from "@/components/job-input";
import { ActionButtons } from "@/components/action-buttons";
import { OutputTabs } from "@/components/output-tabs";
import { AutofillPanel } from "@/components/autofill-panel";
import { KnowledgeBaseUploader, KnowledgeBaseDocument } from "@/components/knowledge-base";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { generateCoverLetter, generateCv } from "@/lib/api";
import { fetchAutofillFields } from "@/lib/api-scraper";
import { predictResponse } from "@/lib/api-prediction";
import { createApplication } from "@/lib/api-applications";
import { sanitizeProfile } from "@/lib/sanitize-profile";
import { defaultProfile } from "@/lib/defaults";
import { getOrCreateUserId } from "@/lib/user-id";
import type { GenerateMeta, LocaleCode, UserProfile } from "@/types/profile";
import type { AutofillResponse } from "@/types/scrape";

export default function WorkspacePage() {
  const [profile, setProfile] = useState<UserProfile>(() => defaultProfile());
  const [jobDescription, setJobDescription] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [locale, setLocale] = useState<LocaleCode>("en");
  const [cvText, setCvText] = useState<string | null>(null);
  const [letterText, setLetterText] = useState<string | null>(null);
  const [loadingCv, setLoadingCv] = useState(false);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<GenerateMeta | null>(null);
  const [savingTracker, setSavingTracker] = useState(false);
  const [autofillData, setAutofillData] = useState<AutofillResponse | null>(null);
  const [loadingAutofill, setLoadingAutofill] = useState(false);
  const [kbDocuments, setKbDocuments] = useState<KnowledgeBaseDocument[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jobhunt_kb_docs");
      if (saved) setKbDocuments(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("jobhunt_kb_docs", JSON.stringify(kbDocuments));
  }, [kbDocuments]);

  const formReady = useMemo(() => {
    const jd = jobDescription.trim();
    const hasIdentity =
      Boolean((profile.full_name || "").trim()) ||
      Boolean((profile.summary || "").trim()) ||
      kbDocuments.filter(d => d.docType === "data").length > 0;
    const hasEnoughContext = jd.length >= 120;
    return {
      jd,
      disabled: !(hasEnoughContext && hasIdentity),
      hint:
        !hasIdentity
          ? "Upload your CV PDF or manually add your name to anchor the draft."
          : !hasEnoughContext
            ? "Paste at least ~120 characters of the posting text so extraction has signal."
            : null,
    };
  }, [
    jobDescription,
    profile.full_name,
    profile.summary,
    kbDocuments
  ]);

  const payload = useMemo(() => {
    const dataDocs = kbDocuments.filter(d => d.docType === "data").map(d => d.text);
    const styleDocs = kbDocuments.filter(d => d.docType === "style").map(d => d.text);
    return {
      profile: sanitizeProfile(profile),
      job_description: formReady.jd,
      job_link: jobLink.trim() || null,
      locale,
      include_match_in_prompts: true,
      cv_knowledge_base: dataDocs.length > 0 ? dataDocs : null,
      cv_style_templates: styleDocs.length > 0 ? styleDocs : null,
    };
  }, [formReady.jd, jobLink, locale, profile, kbDocuments]);

  async function handleGenerateCv() {
    setError(null);
    setSaveMessage(null);
    setLoadingCv(true);
    try {
      const res = await generateCv(payload);
      setCvText(res.text);
      setLastMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "CV generation failed");
    } finally {
      setLoadingCv(false);
    }
  }

  async function handleGenerateLetter() {
    setError(null);
    setSaveMessage(null);
    setLoadingLetter(true);
    try {
      const res = await generateCoverLetter(payload);
      setLetterText(res.text);
      setLastMeta(res.meta);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Cover letter generation failed"
      );
    } finally {
      setLoadingLetter(false);
    }
  }

  const canPersist =
    Boolean(cvText && cvText.trim()) &&
    Boolean(letterText && letterText.trim()) &&
    formReady.jd.length >= 120;

  async function handleSaveToTracker() {
    setSaveMessage(null);
    if (!cvText?.trim() || !letterText?.trim()) {
      setError(
        "Generate both a CV and a cover letter first so their text can be mirrored in the tracker."
      );
      return;
    }

    const analysis = lastMeta?.job_analysis;
    const match = lastMeta?.match_result;
    const userId = getOrCreateUserId();
    setSavingTracker(true);
    setError(null);
    try {
      let responseProbability: number | null = null;
      let confidenceLevel: "low" | "medium" | "high" | null = null;
      try {
        if (analysis) {
          const pred = await predictResponse({
            profile: sanitizeProfile(profile),
            job_analysis: {
              job_title: analysis.job_title ?? null,
              company_name: analysis.company_name ?? null,
              required_skills: analysis.required_skills ?? [],
              nice_to_have_skills: analysis.nice_to_have_skills ?? [],
              keywords: analysis.keywords ?? [],
              experience_level: analysis.experience_level ?? "unknown",
              language_requirements: analysis.language_requirements ?? [],
              location: analysis.location ?? null,
              summary: analysis.summary ?? "",
            },
            match_scores: match
              ? {
                  match_score: match.match_score,
                  skill_match: match.skill_match_score,
                  experience_match: match.experience_match_score,
                  keyword_match: match.keyword_match_score,
                }
              : null,
            strengths: match?.strengths ?? [],
            gaps: match?.gaps ?? [],
            application: { applied_at: new Date().toISOString() },
          });
          responseProbability = pred.response_probability;
          confidenceLevel = pred.confidence_level;
        }
      } catch {
        /* Prediction is additive only — never block persistence. */
      }

      await createApplication(userId, {
        job_title: analysis?.job_title?.trim() || "Untitled role",
        company: analysis?.company_name?.trim() || "Unknown company",
        job_description: formReady.jd,
        match_score: match?.match_score ?? null,
        skill_match: match?.skill_match_score ?? null,
        experience_match: match?.experience_match_score ?? null,
        keyword_match: match?.keyword_match_score ?? null,
        strengths: match?.strengths ?? [],
        gaps: match?.gaps ?? [],
        cv_text: cvText,
        cover_letter_text: letterText,
        response_probability: responseProbability,
        confidence_level: confidenceLevel,
      });
      setSaveMessage(
        analysis
          ? "Snapshot saved against your Postgres tracker — open Dashboard to tweak status filters."
          : "Snapshot saved against your Postgres tracker — open Dashboard to tweak status filters."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save application.");
    } finally {
      setSavingTracker(false);
    }
  }

  async function handleRequestAutofill() {
    setLoadingAutofill(true);
    try {
      const analysis = lastMeta?.job_analysis ?? null;
      const result = await fetchAutofillFields({
        profile: sanitizeProfile(profile),
        job_analysis: analysis,
        cv_text: cvText,
        cover_letter_text: letterText,
      });
      setAutofillData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build autofill data.");
    } finally {
      setLoadingAutofill(false);
    }
  }

  return (
    <main className="relative flex flex-1 flex-col bg-background selection:bg-foreground/10">
      <div className="pointer-events-none absolute inset-x-0 top-[-20%] isolate -z-10 h-[500px] overflow-hidden blur-[100px]">
        <div className="absolute inset-0 mx-auto max-w-4xl rounded-full bg-linear-to-b from-foreground/5 to-transparent opacity-80" />
      </div>
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4 animate-in fade-in-0 zoom-in-95">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Landing
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ClipboardCheck className="size-3.5" />
                Dashboard
              </Link>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Workspace
              </p>
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Create an Application
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Upload your CV, paste the job link, and let the assistant craft a perfect Canva-style CV and cover letter.
              </p>
            </div>
          </div>
          <Separator className="sm:hidden" />
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.06fr)_minmax(460px,0.94fr)]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-border/40 bg-background/80 p-6 shadow-xs backdrop-blur-xl transition-all hover:border-border/80">
              <KnowledgeBaseUploader
                documents={kbDocuments}
                onAddDocument={(doc) => setKbDocuments(prev => [...prev, doc])}
                onRemoveDocument={(id) => setKbDocuments(prev => prev.filter(d => d.id !== id))}
                onChangeDocType={(id, docType) =>
                  setKbDocuments(prev => prev.map(d => d.id === id ? { ...d, docType } : d))
                }
              />
            </div>
            <details className="group [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between rounded-xl bg-muted/30 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors">
                <span>Advanced Profile Settings</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-4">
                <ProfileForm profile={profile} onChange={setProfile} />
              </div>
            </details>
            <JobInput
              jobDescription={jobDescription}
              jobLink={jobLink}
              locale={locale}
              onJobDescriptionChange={setJobDescription}
              onJobLinkChange={setJobLink}
              onLocaleChange={setLocale}
              onScrapeResult={(result) => {
                if (result.job_title || result.company_name) {
                  // Surface scraped metadata into error hint if useful
                }
              }}
            />
            {formReady.hint ? (
              <p className="text-sm text-muted-foreground">{formReady.hint}</p>
            ) : null}
            <ActionButtons
              disabled={formReady.disabled}
              loadingCv={loadingCv}
              loadingLetter={loadingLetter}
              onGenerateCv={() => void handleGenerateCv()}
              onGenerateCoverLetter={() => void handleGenerateLetter()}
            />
            
            <AutofillPanel
              data={autofillData}
              loading={loadingAutofill}
              canRequest={Boolean(cvText?.trim()) && Boolean(letterText?.trim())}
              onRequest={() => void handleRequestAutofill()}
            />
          </section>
          <section
            className={cn(
              "lg:sticky lg:top-[88px] flex flex-col",
              "space-y-4 rounded-[32px] border border-border/30 bg-background/60 p-5 shadow-xs backdrop-blur-2xl transition-all lg:rounded-3xl lg:border lg:p-8 lg:shadow-md hover:border-border/60"
            )}
          >
            {error ? (
              <Alert variant="destructive" className="animate-in fade-in-0">
                <AlertTitle>Something stalled</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">
                  {error}
                </AlertDescription>
              </Alert>
            ) : saveMessage ? (
               <Alert className="border-emerald-600/35 bg-emerald-500/10 animate-in fade-in-0">
                 <AlertTitle>Success</AlertTitle>
                 <AlertDescription className="whitespace-pre-wrap">
                   {saveMessage}
                 </AlertDescription>
               </Alert>
            ) : (
              <p className="text-xs text-muted-foreground">
                API responses stream through once each button settles. Use the Apply button to save to your tracker.
              </p>
            )}
            <OutputTabs
              loadingCv={loadingCv}
              loadingLetter={loadingLetter}
              cvText={cvText}
              coverLetterText={letterText}
              candidateName={profile.full_name || kbDocuments[0]?.filename.replace(".pdf", "")}
              locale={locale}
              onApply={canPersist ? handleSaveToTracker : undefined}
              applying={savingTracker}
              onChangeCvText={setCvText}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
