import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type AuditAction =
  | "LOGIN" | "LOGOUT" | "REGISTER" | "OTP_SENT" | "OTP_VERIFIED"
  | "JOB_CREATED" | "JOB_UPDATED" | "JOB_CLOSED" | "JOB_DELETED"
  | "APPLICATION_CREATED" | "APPLICATION_UPDATED"
  | "PAYMENT_INITIATED" | "PAYMENT_COMPLETED" | "PAYMENT_FAILED"
  | "CREDIT_PURCHASED"
  | "EMPLOYER_VERIFIED" | "WORKER_VERIFIED"
  | "ADMIN_APPROVAL" | "ROLE_CHANGED"
  | "PROFILE_UPDATED"
  | "WEBHOOK_RECEIVED" | "WEBHOOK_FAILED"
  | "REPORT_CREATED" | "REPORT_RESOLVED" | "EXPORT"
  | "SYSTEM";

type AuditEvent = {
  action: AuditAction;
  actorId?: string | null;
  actorRole?: string | null;
  resource?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  traceId?: string | null;
  requestId?: string | null;
};

export async function recordAuditEvent(event: AuditEvent) {
  try {
    await prisma.auditLog.create({ data: event as never });
  } catch (e) {
    logger.error("Failed to record audit event", { action: event.action, error: String(e) });
  }
}

export async function getAuditLogs(params: {
  actorId?: string;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  limit?: number;
  cursor?: string;
}) {
  const where: Record<string, unknown> = {};
  if (params.actorId) where.actorId = params.actorId;
  if (params.action) where.action = params.action;
  if (params.resource) where.resource = params.resource;
  if (params.resourceId) where.resourceId = params.resourceId;

  const items = await prisma.auditLog.findMany({
    where: where as never,
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    take: (params.limit || 50) + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      actorId: true,
      actorRole: true,
      resource: true,
      resourceId: true,
      timestamp: true,
      ip: true,
      userAgent: true,
      traceId: true,
      requestId: true,
      metadata: true,
    },
  });

  const hasMore = items.length > (params.limit || 50);
  if (hasMore) items.pop();

  return { data: items, nextCursor: hasMore ? items[items.length - 1]?.id : null };
}
