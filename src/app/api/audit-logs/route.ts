import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getAuditLogs } from "@/lib/audit";
import type { AuditAction } from "@/lib/audit";
import { apiSuccess, apiUnauthorized } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("workforce_token")?.value;
  if (!token) return apiUnauthorized();

  const payload = verifyToken(token);
  if (!payload || payload.role !== "ADMIN") return apiUnauthorized();

  const { searchParams } = request.nextUrl;
  const result = await getAuditLogs({
    actorId: searchParams.get("actorId") || undefined,
    action: (searchParams.get("action") || undefined) as AuditAction | undefined,
    resource: searchParams.get("resource") || undefined,
    resourceId: searchParams.get("resourceId") || undefined,
    limit: Math.min(Number(searchParams.get("limit")) || 50, 200),
    cursor: searchParams.get("cursor") || undefined,
  });

  return apiSuccess(result);
}
