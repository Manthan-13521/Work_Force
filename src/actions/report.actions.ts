"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createReportSchema } from "@/lib/schemas";

export async function createReport(data: {
  targetType: "JOB" | "WORKER" | "EMPLOYER";
  targetId: string;
  reason: string;
}) {
  const user = await requireAuth();

  const parsed = createReportSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
    },
  });
  return { success: true };
}
