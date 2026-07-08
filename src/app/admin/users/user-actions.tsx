"use client";

import { Button } from "@/components/ui/button";
import { toggleUserStatus, verifyEmployer, verifyWorker } from "@/actions/admin.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserActionsProps {
  userId: string;
  role: string;
  status: string;
  isVerified: boolean;
}

export function UserActions({ userId, role, status, isVerified }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleToggleStatus() {
    setLoading("toggle");
    await toggleUserStatus(userId);
    setLoading(null);
    router.refresh();
  }

  async function handleVerify() {
    setLoading("verify");
    if (role === "EMPLOYER") await verifyEmployer(userId);
    if (role === "WORKER") await verifyWorker(userId);
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2 justify-end">
      {(role === "EMPLOYER" || role === "WORKER") && !isVerified && (
        <Button size="sm" variant="outline" onClick={handleVerify} loading={loading === "verify"}>
          Verify
        </Button>
      )}
      <Button
        size="sm"
        variant={status === "ACTIVE" ? "destructive" : "default"}
        onClick={handleToggleStatus}
        loading={loading === "toggle"}
      >
        {status === "ACTIVE" ? "Suspend" : "Activate"}
      </Button>
    </div>
  );
}
