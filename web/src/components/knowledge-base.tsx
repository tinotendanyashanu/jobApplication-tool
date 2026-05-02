"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export interface KnowledgeBaseDocument {
  id: string;
  filename: string;
  text: string;
}

interface KnowledgeBaseProps {
  documents: KnowledgeBaseDocument[];
  onAddDocument: (doc: KnowledgeBaseDocument) => void;
  onRemoveDocument: (id: string) => void;
}

export function KnowledgeBaseUploader({ documents, onAddDocument, onRemoveDocument }: KnowledgeBaseProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear the input so the same file can be uploaded again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Knowledge Base</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Upload previous CVs. We extract the text to power your custom applications.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2 text-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group flex items-center justify-between rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm transition-all hover:bg-muted/30"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium text-foreground/80">{doc.filename}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onRemoveDocument(doc.id)}
            >
              <X className="size-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        ))}
      </div>

      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 py-6 text-center transition-colors hover:bg-muted/30 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        {isUploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloud className="size-6 text-muted-foreground mb-2" />
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {isUploading ? "Extracting text..." : "Click to upload PDF"}
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
  );
}
