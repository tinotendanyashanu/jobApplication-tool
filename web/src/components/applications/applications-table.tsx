"use client";

import { Eye, Trash2 } from "lucide-react";

import type { ApplicationRecord, ApplicationStatus } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDropdown } from "@/components/applications/status-dropdown";
import { formatMediumDate } from "@/components/applications/date-format";
import { STATUS_LABELS, statusBadgeVariant } from "@/components/applications/status-helpers";

export type ApplicationsTableProps = {
  rows: ApplicationRecord[];
  busyIds: Record<string, boolean>;
  onView: (row: ApplicationRecord) => void;
  onDelete: (row: ApplicationRecord) => void;
  onStatusChange: (
    row: ApplicationRecord,
    next: ApplicationStatus
  ) => void | Promise<void>;
};

export function ApplicationsTable({
  rows,
  busyIds,
  onView,
  onDelete,
  onStatusChange,
}: ApplicationsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/95 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead className="bg-muted/55 text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Job title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">Outlook</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={7}>
                  No applications yet. Save one from your workspace once your drafts are ready.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const busy = Boolean(busyIds[row.id]);
                return (
                  <tr key={row.id} className="hover:bg-muted/25">
                    <td className="max-w-[240px] truncate px-4 py-3 font-medium">
                      {row.job_title}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                      {row.company}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {row.match_score ?? "—"}
                          {typeof row.match_score === "number" ? (
                            <span className="text-muted-foreground">/100</span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
                        <span>
                          {typeof row.response_probability === "number"
                            ? `${row.response_probability}/100`
                            : "—"}
                        </span>
                        {typeof row.confidence_level === "string" ? (
                          <span className="text-muted-foreground">({row.confidence_level})</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusBadgeVariant(row.status)}>
                          {STATUS_LABELS[row.status]}
                        </Badge>
                        <StatusDropdown
                          value={row.status}
                          disabled={busy}
                          onChange={(next) => void onStatusChange(row, next)}
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatMediumDate(row.applied_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          disabled={busy}
                          onClick={() => onView(row)}
                        >
                          <Eye />
                          View
                        </Button>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="destructive"
                          disabled={busy}
                          aria-label={`Delete ${row.job_title}`}
                          onClick={() => onDelete(row)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <footer className="border-t border-border/70 px-4 py-3 text-xs text-muted-foreground">
        Showing {rows.length} {rows.length === 1 ? "application" : "applications"} aligned to your tracker profile.
      </footer>
    </div>
  );
}
