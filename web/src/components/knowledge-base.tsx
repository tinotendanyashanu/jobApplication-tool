"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, X, Loader2, Palette, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export interface KnowledgeBaseDocument {
  id: string;
  filename: string;
  text: string;
  /** "data" = extract skills/experience from this CV; "style" = formatting template only */
  docType: "data" | "style";
}

interface KnowledgeBaseProps {
  documents: KnowledgeBaseDocument[];
  onAddDocument: (doc: KnowledgeBaseDocument) => void;
  onRemoveDocument: (id: string) => void;
  onChangeDocType: (id: string, docType: "data" | "style") => void;
}

export function KnowledgeBaseUploader({
  documents,
  onAddDocument,
  onRemoveDocument,
  onChangeDocType,
}: KnowledgeBaseProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [pendingType, setPendingType] = useState<"data" | "style">("data");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = "";

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/extract-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Failed to extract PDF text");
      }

      const data = await res.json();

      onAddDocument({
        id: crypto.randomUUID(),
        filename: data.filename,
        text: data.text,
        docType: pendingType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  const dataDocuments = documents.filter((d) => d.docType === "data");
  const styleDocuments = documents.filter((d) => d.docType === "style");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">Knowledge Base</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Upload previous CVs as <strong>data sources</strong>, or a sample CV as a{" "}
          <strong>style template</strong>. The engine extracts your facts from data CVs and
          mirrors the layout from style templates.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2 text-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploaded documents */}
      {documents.length > 0 && (
        <div className="space-y-3">
          {dataDocuments.length > 0 && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground">
                <Database className="size-3" />
                Data Sources
              </p>
              {dataDocuments.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  onRemove={onRemoveDocument}
                  onChangeType={onChangeDocType}
                />
              ))}
            </div>
          )}

          {styleDocuments.length > 0 && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground">
                <Palette className="size-3" />
                Style Templates
              </p>
              {styleDocuments.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  onRemove={onRemoveDocument}
                  onChangeType={onChangeDocType}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload type selector + drop zone */}
      <div className="space-y-2">
        <div className="flex rounded-xl border border-border/50 p-0.5 bg-muted/20 text-xs">
          <button
            type="button"
            onClick={() => setPendingType("data")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
              pendingType === "data"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Database className="size-3" />
            Data source
          </button>
          <button
            type="button"
            onClick={() => setPendingType("style")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
              pendingType === "style"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Palette className="size-3" />
            Style template
          </button>
        </div>

        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 py-5 text-center transition-colors hover:bg-muted/30 hover:border-primary/50",
            isUploading && "pointer-events-none opacity-60"
          )}
        >
          {isUploading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : pendingType === "style" ? (
            <Palette className="size-5 text-muted-foreground mb-1.5" />
          ) : (
            <UploadCloud className="size-5 text-muted-foreground mb-1.5" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {isUploading
              ? "Extracting text…"
              : pendingType === "style"
              ? "Upload style template PDF"
              : "Upload data source PDF"}
          </span>
          <span className="mt-0.5 text-[0.68rem] text-muted-foreground/60">
            {pendingType === "style"
              ? "Layout will be copied — no data extracted"
              : "Skills & experience will be extracted"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}

function DocumentRow({
  doc,
  onRemove,
  onChangeType,
}: {
  doc: KnowledgeBaseDocument;
  onRemove: (id: string) => void;
  onChangeType: (id: string, t: "data" | "style") => void;
}) {
  return (
    <div className="group flex items-center justify-between rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all hover:bg-muted/30">
      <div className="flex items-center gap-2 overflow-hidden">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium text-foreground/80">{doc.filename}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          title={doc.docType === "data" ? "Switch to style template" : "Switch to data source"}
          onClick={() => onChangeType(doc.id, doc.docType === "data" ? "style" : "data")}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {doc.docType === "data" ? <Palette className="size-3.5" /> : <Database className="size-3.5" />}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => onRemove(doc.id)}
        >
          <X className="size-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
    </div>
  );
}
