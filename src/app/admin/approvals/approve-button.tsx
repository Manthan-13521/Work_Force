"use client";

import { Button } from "@/components/ui/button";
import { verifyEmployer, verifyWorker } from "@/actions/admin.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApproveButton({ userId, type }: { userId: string; type: "employer" | "worker" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    if (type === "employer") await verifyEmployer(userId);
    else await verifyWorker(userId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" onClick={handleApprove} loading={loading}>
      Approve
    </Button>
  );
}
