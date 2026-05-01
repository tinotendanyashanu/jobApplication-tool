"use client";

import { useMemo, useState } from "react";
import { Copy, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type PreviewPanelProps = {
  title: string;
  subtitle?: string;
  body?: string | null;
  loading?: boolean;
  emptyFallback: string;
  fileStem: string;
};

export function PreviewPanel({
  title,
  subtitle,
  body,
  loading,
  emptyFallback,
  fileStem,
}: PreviewPanelProps) {
  const [copying, setCopying] = useState(false);

  const hasContent = Boolean((body ?? "").trim());

  const safeBody = body?.trim() || "";

  const filenameBase = useMemo(() => sanitizeFilename(fileStem), [fileStem]);

  function downloadText(content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, `${filenameBase}.txt`);
  }

  async function copyToClipboard(content: string) {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      alert("Clipboard permission denied.");
    } finally {
      setCopying(false);
    }
  }

  function handlePdfImport() {
    void import("@/lib/pdf").then(({ downloadPlainTextPdf }) => {
      if (!safeBody.trim()) return;
      downloadPlainTextPdf(title, safeBody, `${filenameBase}.pdf`);
    });
  }

  return (
    <Card className="flex h-[640px] max-h-[70vh] flex-col border-none bg-muted/15 shadow-inner">
      <CardHeader className="sr-only">
        <CardTitle>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-0">
        <div className="flex flex-wrap gap-2 border-b border-border/60 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasContent || loading || copying}
            onClick={() => void copyToClipboard(safeBody)}
          >
            <Copy />
            {copying ? "Copying…" : "Copy"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasContent || loading}
            onClick={() => downloadText(safeBody)}
          >
            <Download />
            .txt
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!hasContent || loading}
            onClick={handlePdfImport}
          >
            <FileText />
            PDF
          </Button>
        </div>
        <div className="min-h-[320px] flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="space-y-3 pt-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton className="h-4 w-full" key={`sk-${idx}`} />
              ))}
            </div>
          ) : hasContent ? (
            <article className="whitespace-pre-wrap pt-3 text-[0.95rem] leading-[1.72] tracking-tight">
              {safeBody}
            </article>
          ) : (
            <p className="pt-3 text-sm text-muted-foreground">{emptyFallback}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  queueMicrotask(() => URL.revokeObjectURL(url));
}

function sanitizeFilename(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[^\w\-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "document"
  );
}
