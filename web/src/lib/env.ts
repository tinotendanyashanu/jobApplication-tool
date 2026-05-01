export function getApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (publicUrl) {
    return publicUrl.replace(/\/$/, "");
  }
  // Same-origin rewrite → FastAPI (see next.config.ts). Avoids fetching the Next app by mistake (HTML 404).
  if (typeof window !== "undefined") {
    return "/api/proxy";
  }
  const serverOnly = (
    process.env.API_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");
  return serverOnly;
}
