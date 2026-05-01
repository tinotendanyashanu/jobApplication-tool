const STORAGE_KEY = "jobassistant_user_id";

function randomUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") {
    return randomUuid();
  }
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing && existing.trim()) {
    return existing.trim();
  }
  const next = randomUuid();
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}
