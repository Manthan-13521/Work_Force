import { Badge } from "./badge";

interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "outline" }> = {
  APPLIED: { label: "Applied", variant: "default" },
  SHORTLISTED: { label: "Shortlisted", variant: "warning" },
  REJECTED: { label: "Rejected", variant: "danger" },
  HIRED: { label: "Hired", variant: "success" },
  ACTIVE: { label: "Active", variant: "success" },
  CLOSED: { label: "Closed", variant: "outline" },
  EXPIRED: { label: "Expired", variant: "outline" },
  SUSPENDED: { label: "Suspended", variant: "danger" },
  PENDING: { label: "Pending", variant: "warning" },
  REVIEWED: { label: "Reviewed", variant: "default" },
  DISMISSED: { label: "Dismissed", variant: "outline" },
  SUCCESS: { label: "Success", variant: "success" },
  FAILED: { label: "Failed", variant: "danger" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
