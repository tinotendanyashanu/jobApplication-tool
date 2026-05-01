"use client";

import { BriefcaseBusiness, Trash2 } from "lucide-react";

import type { ApplicationRecord, ApplicationStatus } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusDropdown } from "@/components/applications/status-dropdown";
import { formatMediumDate } from "@/components/applications/date-format";
import { STATUS_LABELS, statusBadgeVariant } from "@/components/applications/status-helpers";

export type ApplicationCardProps = {
  row: ApplicationRecord;
  busy?: boolean;
  onView: (row: ApplicationRecord) => void;
  onDelete: (row: ApplicationRecord) => void;
  onStatusChange: (
    row: ApplicationRecord,
    next: ApplicationStatus
  ) => void | Promise<void>;
};

export function ApplicationCard({
  row,
  busy,
  onView,
  onDelete,
  onStatusChange,
}: ApplicationCardProps) {
  return (
    <Card className="border-border/70 bg-background/95 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-tight">{row.job_title}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <BriefcaseBusiness className="size-4" />
              {row.company}
            </CardDescription>
          </div>
          <Badge variant={statusBadgeVariant(row.status)}>{STATUS_LABELS[row.status]}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">
            Match {row.match_score ?? "—"}
            {typeof row.match_score === "number" ? "/100" : ""}
          </span>
          <span className="text-border">·</span>
          <span className="font-mono">
            Outlook{" "}
            {typeof row.response_probability === "number"
              ? `${row.response_probability}/100`
              : "—"}
            {typeof row.response_probability === "number" &&
            typeof row.confidence_level === "string" ? (
              <span className="text-muted-foreground"> ({row.confidence_level})</span>
            ) : null}
          </span>
          <span className="text-border">·</span>
          <span>Applied {formatMediumDate(row.applied_at)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatusDropdown
          value={row.status}
          disabled={busy}
          onChange={(next) => void onStatusChange(row, next)}
        />
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t border-border/60 bg-muted/30">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onView(row)}>
          View details
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="destructive"
          disabled={busy}
          aria-label={`Delete ${row.job_title}`}
          onClick={() => onDelete(row)}
        >
          <Trash2 />
        </Button>
      </CardFooter>
    </Card>
  );
}
