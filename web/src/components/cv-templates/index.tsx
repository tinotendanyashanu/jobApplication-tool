import React from "react";
import { TemplateModern } from "./template-modern";
import { TemplateMinimalist } from "./template-minimalist";
import { TemplateIntegration } from "./template-integration";
import { ParsedCV } from "@/lib/parse-cv";

export type TemplateType = "modern" | "minimalist" | "integration";

export function CvTemplateViewer({ data, template }: { data: ParsedCV, template: TemplateType }) {
  if (template === "minimalist") {
     return <TemplateMinimalist data={data} />;
  }
  if (template === "integration") {
     return <TemplateIntegration data={data} />;
  }
  return <TemplateModern data={data} />;
}
