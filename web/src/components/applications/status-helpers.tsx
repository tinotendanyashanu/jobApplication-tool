import type { ApplicationStatus } from "@/types/application";
import type { BadgeProps } from "@/components/ui/badge";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  no_response: "No response",
};

export const ALL_STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
  "no_response",
];

export function statusBadgeVariant(
  status: ApplicationStatus
): NonNullable<BadgeProps["variant"]> {
  switch (status) {
    case "offer":
      return "success";
    case "interview":
      return "info";
    case "applied":
      return "warning";
    case "rejected":
    case "no_response":
      return "destructive";
    default:
      return "muted";
  }
}
