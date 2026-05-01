import { getApiBaseUrl } from "@/lib/env";
import { readError } from "@/lib/api";
import type { ScrapeResult, AutofillResponse } from "@/types/scrape";
import type { UserProfile, JobAnalysisMeta } from "@/types/profile";

export async function scrapeJobUrl(url: string): Promise<ScrapeResult> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/scrape-job`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return (await res.json()) as ScrapeResult;
}

export async function fetchAutofillFields(params: {
  profile: UserProfile;
  job_analysis?: JobAnalysisMeta | null;
  cv_text?: string | null;
  cover_letter_text?: string | null;
}): Promise<AutofillResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/autofill-fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return (await res.json()) as AutofillResponse;
}
