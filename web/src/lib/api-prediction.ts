import type {
  ApplicationOutcome,
  PredictResponsePayload,
  PredictResponseRequest,
} from "@/types/prediction";
import type { ApplicationRecord } from "@/types/application";
import { readError } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/env";

export async function predictResponse(
  payload: PredictResponseRequest
): Promise<PredictResponsePayload> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/predict-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return (await res.json()) as PredictResponsePayload;
}

export async function submitApplicationFeedback(
  userId: string,
  payload: {
    application_id: string;
    outcome: ApplicationOutcome;
    response_time_days?: number | null;
  }
): Promise<ApplicationRecord> {
  const base = getApiBaseUrl();
  const body: Record<string, unknown> = {
    application_id: payload.application_id,
    outcome: payload.outcome,
  };
  if (payload.response_time_days != null) {
    body.response_time_days = payload.response_time_days;
  }
  const res = await fetch(`${base}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return (await res.json()) as ApplicationRecord;
}
