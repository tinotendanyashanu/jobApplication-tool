import type {
  ApplicationCreatePayload,
  ApplicationRecord,
  ApplicationUpdatePayload,
  ApplicationsSort,
  ApplicationStatus,
} from "@/types/application";
import { readError } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/env";

function headers(userId: string, json = false): HeadersInit {
  const h: HeadersInit = { "X-User-Id": userId };
  if (json) {
    (h as Record<string, string>)["Content-Type"] = "application/json";
  }
  return h;
}

export async function listApplications(
  userId: string,
  params?: {
    q?: string;
    status?: ApplicationStatus | null;
    sort?: ApplicationsSort;
  }
): Promise<ApplicationRecord[]> {
  const base = getApiBaseUrl();
  const sp = new URLSearchParams();
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.status) sp.set("status", params.status);
  if (params?.sort) sp.set("sort", params.sort);
  const qs = sp.toString();
  const url = `${base}/applications${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: headers(userId) });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as ApplicationRecord[];
}

export async function createApplication(
  userId: string,
  body: ApplicationCreatePayload
): Promise<ApplicationRecord> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/applications`, {
    method: "POST",
    headers: headers(userId, true),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as ApplicationRecord;
}

export async function updateApplication(
  userId: string,
  id: string,
  body: ApplicationUpdatePayload
): Promise<ApplicationRecord> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/applications/${id}`, {
    method: "PUT",
    headers: headers(userId, true),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as ApplicationRecord;
}

export async function deleteApplication(userId: string, id: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/applications/${id}`, {
    method: "DELETE",
    headers: headers(userId),
  });
  if (!res.ok) throw new Error(await readError(res));
}
