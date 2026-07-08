"use client";

import { Button } from "@/components/ui/button";
import { toggleJobStatus } from "@/actions/admin.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function JobActions({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await toggleJobStatus(jobId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant={status === "ACTIVE" ? "destructive" : "default"}
      onClick={handleToggle}
      loading={loading}
    >
      {status === "ACTIVE" ? "Suspend" : "Activate"}
    </Button>
  );
}
