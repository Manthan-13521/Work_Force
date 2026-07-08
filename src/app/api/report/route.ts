import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createReport } from "@/actions/report.actions";
import { env } from "@/env";

const VALID_TARGET_TYPES = ["JOB", "WORKER", "EMPLOYER"] as const;
type TargetType = (typeof VALID_TARGET_TYPES)[number];

function isValidTargetType(value: string): value is TargetType {
  return VALID_TARGET_TYPES.includes(value as TargetType);
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const targetType = formData.get("targetType");
  const targetId = formData.get("targetId");
  const reason = formData.get("reason");

  if (typeof targetType !== "string" || !isValidTargetType(targetType) || typeof targetId !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await createReport({
    targetType,
    targetId,
    reason: typeof reason === "string" ? reason : "Reported by user",
  });

  const referer = request.headers.get("referer") || "";
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (referer && referer.startsWith(appUrl)) {
    return NextResponse.redirect(new URL(referer));
  }
  return NextResponse.redirect(new URL("/"));
}
