"use client";

import { Button } from "@/components/ui/button";
import { updateApplicationStatus } from "@/actions/application.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApplicantActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(status: "SHORTLISTED" | "REJECTED" | "HIRED") {
    setLoading(status);
    await updateApplicationStatus(applicationId, status);
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleAction("SHORTLISTED")}
        loading={loading === "SHORTLISTED"}
      >
        Shortlist
      </Button>
      <Button
        size="sm"
        variant="default"
        onClick={() => handleAction("HIRED")}
        loading={loading === "HIRED"}
      >
        Hire
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive"
        onClick={() => handleAction("REJECTED")}
        loading={loading === "REJECTED"}
      >
        Reject
      </Button>
    </div>
  );
}
