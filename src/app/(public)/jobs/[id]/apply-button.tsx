"use client";

import { Button } from "@/components/ui/button";
import { applyToJob } from "@/actions/application.actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApplyButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const router = useRouter();

  async function handleApply() {
    setLoading(true);
    const result = await applyToJob(jobId);
    setLoading(false);

    if (result?.error) {
      if (result.error === "Already applied") {
        setApplied(true);
      }
      return;
    }
    setApplied(true);
    router.refresh();
  }

  if (applied) {
    return (
      <Button className="w-full" variant="outline" disabled>
        Applied
      </Button>
    );
  }

  return (
    <Button className="w-full" onClick={handleApply} loading={loading}>
      Apply Now
    </Button>
  );
}
