"use client";

import { useMemo, useState } from "react";
import { Copy, Download, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseMarkdownCV } from "@/lib/parse-cv";
import { CvTemplateViewer, TemplateType } from "./cv-templates";
import { cn } from "@/lib/utils";

export type PreviewPanelProps = {
  title: string;
  subtitle?: string;
  body?: string | null;
  loading?: boolean;
  emptyFallback: string;
  fileStem: string;
  variant?: "cv" | "letter";
  onApply?: () => void;
  applying?: boolean;
};

export function PreviewPanel({
  title,
  subtitle,
  body,
  loading,
  emptyFallback,
  fileStem,
  variant = "cv",
  onApply,
  applying,
}: PreviewPanelProps) {
  const [copying, setCopying] = useState(false);
  const [template, setTemplate] = useState<TemplateType>("modern");

  const hasContent = Boolean((body ?? "").trim());
  const safeBody = body?.trim() || "";
  const parsedData = useMemo(() => parseMarkdownCV(safeBody), [safeBody]);

  const filenameBase = useMemo(() => sanitizeFilename(fileStem), [fileStem]);

  const isCv = variant === "cv";
  const hasParsedContent = isCv && Boolean(parsedData.header.name || parsedData.experience.length > 0);

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

  function handlePdfDownload() {
    if (hasParsedContent) {
      void import("@/lib/pdf").then(({ downloadCvPdf }) => {
        downloadCvPdf(parsedData, `${filenameBase}.pdf`);
      });
    } else {
      void import("@/lib/pdf").then(({ downloadPlainTextPdf }) => {
        if (!safeBody.trim()) return;
        downloadPlainTextPdf(title, safeBody, `${filenameBase}.pdf`);
      });
    }
  }

  return (
    <Card className="flex h-[750px] max-h-[85vh] flex-col border-none bg-muted/15 shadow-inner">
      <CardHeader className="sr-only">
        <CardTitle>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-0 relative">
        <div className="flex flex-wrap items-center justify-between border-b border-border/60 px-6 py-4 bg-background/50 backdrop-blur-sm z-10 sticky top-0">
          <div className="flex flex-wrap gap-2">
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
              variant="outline"
              disabled={!hasContent || loading}
              onClick={handlePdfDownload}
            >
              <FileText />
              PDF
            </Button>

            {hasContent && isCv && (
              <div className="flex items-center gap-1 ml-4 border-l border-border/60 pl-4">
                <span className="text-xs text-muted-foreground mr-1">Template:</span>
                <button
                  onClick={() => setTemplate("modern")}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all",
                    template === "modern" ? "border-slate-800 scale-110" : "border-transparent bg-slate-200",
                  )}
                  style={{ background: "linear-gradient(135deg, #0f172a 50%, #f8fafc 50%)" }}
                  title="Modern"
                />
                <button
                  onClick={() => setTemplate("minimalist")}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all",
                    template === "minimalist" ? "border-slate-800 scale-110" : "border-transparent bg-slate-200",
                  )}
                  style={{
                    background: "#ffffff",
                    border: template === "minimalist" ? "2px solid #000" : "2px solid #e2e8f0",
                  }}
                  title="Minimalist"
                />
              </div>
            )}
          </div>

          {onApply && (
            <Button
              type="button"
              size="sm"
              disabled={!hasContent || loading || applying}
              onClick={onApply}
              className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Send className="w-4 h-4 mr-1.5" />
              {applying ? "Applying..." : "Apply Now"}
            </Button>
          )}
        </div>

        <div className="min-h-[320px] flex-1 overflow-y-auto px-6 pb-6 bg-muted/30">
          {loading ? (
            <div className="space-y-3 pt-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton className="h-4 w-full" key={`sk-${idx}`} />
              ))}
            </div>
          ) : hasContent ? (
            <div className="pt-6">
              {isCv ? (
                <CvTemplateViewer data={parsedData} template={template} />
              ) : (
                <LetterViewer text={safeBody} />
              )}
            </div>
          ) : (
            <p className="pt-6 text-sm text-muted-foreground">{emptyFallback}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LetterViewer({ text }: { text: string }) {
  const paragraphs = text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);

  return (
    <div
      className="w-full bg-white shadow-lg mx-auto p-10 font-sans text-gray-800"
      style={{ minHeight: "800px" }}
    >
      {paragraphs.map((para, i) => (
        <p key={i} className="text-sm leading-relaxed mb-4 text-gray-700">
          {para}
        </p>
      ))}
    </div>
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
