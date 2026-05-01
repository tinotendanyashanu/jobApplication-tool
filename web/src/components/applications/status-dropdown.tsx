"use client";

import type { ApplicationStatus } from "@/types/application";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_STATUSES, STATUS_LABELS } from "@/components/applications/status-helpers";

export type StatusDropdownProps = {
  value: ApplicationStatus;
  disabled?: boolean;
  onChange: (next: ApplicationStatus) => void;
};

export function StatusDropdown({ value, disabled, onChange }: StatusDropdownProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(v) => onChange(v as ApplicationStatus)}
    >
      <SelectTrigger size="sm" className="min-w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALL_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
