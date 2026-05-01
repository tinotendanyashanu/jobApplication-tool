"use client";

import { Search } from "lucide-react";

import type { ApplicationStatus, ApplicationsSort } from "@/types/application";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_STATUSES, STATUS_LABELS } from "@/components/applications/status-helpers";

export type FilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: ApplicationStatus | "all";
  onStatusChange: (value: ApplicationStatus | "all") => void;
  sort: ApplicationsSort;
  onSortChange: (value: ApplicationsSort) => void;
  view: "table" | "cards";
  onViewChange: (value: "table" | "cards") => void;
};

export function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  view,
  onViewChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-[min(640px,100%)] flex-1 flex-col gap-2">
        <Label htmlFor="applications-search" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Search
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="applications-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Job title or company"
            className="h-9 pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Status
          </p>
          <Select value={status} onValueChange={(v) => onStatusChange(v as FilterBarProps["status"])}>
            <SelectTrigger className="min-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Sort
          </p>
          <Select value={sort} onValueChange={(v) => onSortChange(v as ApplicationsSort)}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Date (newest)</SelectItem>
              <SelectItem value="date_asc">Date (oldest)</SelectItem>
              <SelectItem value="score_desc">Match score (high)</SelectItem>
              <SelectItem value="score_asc">Match score (low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Layout
          </p>
          <Select value={view} onValueChange={(v) => onViewChange(v as "table" | "cards")}>
            <SelectTrigger className="min-w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="cards">Cards</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
