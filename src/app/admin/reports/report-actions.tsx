"use client";

import { Button } from "@/components/ui/button";
import { updateReportStatus } from "@/actions/admin.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReportActions({ reportId, status }: { reportId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status !== "PENDING") return null;

  async function handleAction(newStatus: "REVIEWED" | "DISMISSED") {
    setLoading(true);
    await updateReportStatus(reportId, newStatus);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="default" onClick={() => handleAction("REVIEWED")} loading={loading}>
        Resolve
      </Button>
      <Button size="sm" variant="outline" onClick={() => handleAction("DISMISSED")} loading={loading}>
        Dismiss
      </Button>
    </div>
  );
}
