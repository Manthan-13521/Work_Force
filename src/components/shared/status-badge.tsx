import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "outline" | "info" | "secondary" | "verified" }> = {
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
  VERIFIED: { label: "Verified", variant: "verified" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
