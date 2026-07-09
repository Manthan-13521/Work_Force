"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createReport } from "@/actions/report.actions";

interface ReportButtonProps {
  targetType: "JOB" | "WORKER" | "EMPLOYER";
  targetId: string;
}

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      textareaRef.current?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError("Please provide a reason (at least 10 characters)");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await createReport({ targetType, targetId, reason: reason.trim() });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
      router.refresh();
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return <p className="text-xs text-green-600 text-center">{`Report submitted. We'll review it shortly.`}</p>;
  }

  return (
    <div className="mt-4">
      <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => setOpen(true)} type="button">
        Report this listing
      </Button>
      {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
            <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="report-title" className="bg-background rounded-lg p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 id="report-title" className="font-semibold text-lg">Report this listing</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Reason for reporting</label>
                <textarea
                  ref={textareaRef}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={"Describe why you are reporting this listing (e.g., fake job, wrong details, spam)..."}
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">{reason.length}/1000</p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" loading={loading} variant="destructive">
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
