import type { GeneratePayload, SingleGenerateResponse } from "@/types/profile";
import { getApiBaseUrl } from "@/lib/env";

export async function readError(res: Response): Promise<string> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await res.json().catch(() => null);
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) {
      return body.detail
        .map((x: unknown) =>
          typeof x === "object" && x !== null && "msg" in x
            ? String((x as { msg: unknown }).msg)
            : JSON.stringify(x)
        )
        .join("; ");
    }
  }
  const text = (await res.text()) || `${res.status} ${res.statusText}`;
  const trimmed = text.trimStart();
  if (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.toLowerCase().startsWith("<html")
  ) {
    return (
      `Got an HTML ${res.status} page instead of the API — NEXT_PUBLIC_API_URL may point at this Next app ` +
      `instead of FastAPI. Remove it to use the /api/proxy rewrite, or set NEXT_PUBLIC_API_URL to your FastAPI ` +
      `origin (e.g. http://127.0.0.1:8000). Ensure the API server is running.`
    );
  }
  return text;
}

export async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return (await res.json()) as T;
}

export async function generateCv(
  payload: GeneratePayload
): Promise<SingleGenerateResponse> {
  return postJson<SingleGenerateResponse>("/generate-cv", payload);
}

export async function generateCoverLetter(
  payload: GeneratePayload
): Promise<SingleGenerateResponse> {
  return postJson<SingleGenerateResponse>(
    "/generate-cover-letter",
    payload
  );
}
