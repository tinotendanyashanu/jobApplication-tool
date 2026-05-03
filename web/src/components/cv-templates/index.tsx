import React from "react";
import { TemplateModern } from "./template-modern";
import { TemplateMinimalist } from "./template-minimalist";
import { TemplateIntegration } from "./template-integration";
import { ParsedCV } from "@/lib/parse-cv";

export type TemplateType = "modern" | "minimalist" | "integration";

export type TemplateProps = {
  data: ParsedCV;
  onUpdateHeader?: (newName: string, newContact: string[]) => void;
};

export function CvTemplateViewer({ data, template, onUpdateHeader }: { data: ParsedCV, template: TemplateType, onUpdateHeader?: (newName: string, newContact: string[]) => void }) {
  if (template === "minimalist") {
     return <TemplateMinimalist data={data} onUpdateHeader={onUpdateHeader} />;
  }
  if (template === "integration") {
     return <TemplateIntegration data={data} onUpdateHeader={onUpdateHeader} />;
  }
  return <TemplateModern data={data} onUpdateHeader={onUpdateHeader} />;
}
