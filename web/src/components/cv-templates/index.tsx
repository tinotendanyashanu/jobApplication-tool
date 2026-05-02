import React from "react";
import { TemplateModern } from "./template-modern";
import { TemplateMinimalist } from "./template-minimalist";
import { ParsedCV } from "@/lib/parse-cv";

export type TemplateType = "modern" | "minimalist";

export function CvTemplateViewer({ data, template }: { data: ParsedCV, template: TemplateType }) {
  if (template === "minimalist") {
     return <TemplateMinimalist data={data} />;
  }
  return <TemplateModern data={data} />;
}
