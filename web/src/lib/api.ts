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
  return (await res.text()) || `${res.status} ${res.statusText}`;
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
