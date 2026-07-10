"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { buildPaginatedResponse, PAGE_SIZE } from "@/lib/pagination";
import {
  toggleUserStatusSchema,
  verifyEmployerSchema,
  verifyWorkerSchema,
  toggleJobStatusSchema,
  updateReportStatusSchema,
  createCategorySchema,
  createCitySchema,
  idParamSchema,
} from "@/lib/schemas";
import { cached, cacheKey, invalidateCache } from "@/lib/cache";
import { recordAuditEvent } from "@/lib/audit";

export async function getAdminStats() {
  await requireAuth(["ADMIN"]);

  const [users, jobs, applications, payments, reports] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  return { users, jobs, applications, revenue: payments._sum.amount || 0, pendingReports: reports };
}

export async function getAdminUsers(search?: string, pagination?: { cursor?: string; limit?: number }) {
  await requireAuth(["ADMIN"]);
  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }
  const limitVal = pagination?.limit ?? PAGE_SIZE;
  const items = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      employerProfile: { select: { companyName: true, industry: true, gstNumber: true, isVerified: true } },
      workerProfile: { select: { trade: true, idDocUrl: true, isVerified: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limitVal + 1,
    ...(pagination?.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
  });
  return buildPaginatedResponse(items, limitVal);
}

export async function toggleUserStatus(userId: string) {
  await requireAuth(["ADMIN"]);

  const parsed = toggleUserStatusSchema.safeParse({ userId });
  if (!parsed.success) return;

  const suspended = await prisma.user.updateMany({
    where: { id: parsed.data.userId, status: "ACTIVE" },
    data: { status: "SUSPENDED" },
  });

  if (suspended.count === 0) {
    const activated = await prisma.user.updateMany({
      where: { id: parsed.data.userId, status: "SUSPENDED" },
      data: { status: "ACTIVE" },
    });
    if (activated.count === 0) return;
  }

  await recordAuditEvent({ action: "ADMIN_APPROVAL", actorId: parsed.data.userId, actorRole: "ADMIN", resource: "user", resourceId: parsed.data.userId });
  revalidateTag("admin-users", "max");
}

export async function verifyEmployer(employerId: string) {
  await requireAuth(["ADMIN"]);

  const parsed = verifyEmployerSchema.safeParse({ employerId });
  if (!parsed.success) return;

  const result = await prisma.employerProfile.updateMany({
    where: { userId: parsed.data.employerId, isVerified: { not: true } },
    data: { isVerified: true, verifiedAt: new Date() },
  });
  if (result.count === 0) return;

  await recordAuditEvent({ action: "EMPLOYER_VERIFIED", actorId: parsed.data.employerId, actorRole: "ADMIN", resource: "employer_profile", resourceId: parsed.data.employerId });
  revalidateTag("admin-users", "max");
}

export async function verifyWorker(workerId: string) {
  await requireAuth(["ADMIN"]);

  const parsed = verifyWorkerSchema.safeParse({ workerId });
  if (!parsed.success) return;

  const result = await prisma.workerProfile.updateMany({
    where: { userId: parsed.data.workerId, isVerified: { not: true } },
    data: { isVerified: true },
  });
  if (result.count === 0) return;

  await recordAuditEvent({ action: "WORKER_VERIFIED", actorId: parsed.data.workerId, actorRole: "ADMIN", resource: "worker_profile", resourceId: parsed.data.workerId });
  revalidateTag("admin-users", "max");
}

export async function getAdminJobs(pagination?: { cursor?: string; limit?: number }) {
  await requireAuth(["ADMIN"]);
  const limitVal = pagination?.limit ?? PAGE_SIZE;
  const items = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      employer: { select: { name: true, employerProfile: { select: { companyName: true } } } },
      _count: { select: { applications: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limitVal + 1,
    ...(pagination?.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
  });
  return buildPaginatedResponse(items, limitVal);
}

export async function toggleJobStatus(jobId: string) {
  await requireAuth(["ADMIN"]);

  const parsed = toggleJobStatusSchema.safeParse({ jobId });
  if (!parsed.success) return;

  const suspended = await prisma.job.updateMany({
    where: { id: parsed.data.jobId, status: "ACTIVE" },
    data: { status: "SUSPENDED" },
  });

  if (suspended.count === 0) {
    const activated = await prisma.job.updateMany({
      where: { id: parsed.data.jobId, status: "SUSPENDED" },
      data: { status: "ACTIVE" },
    });
    if (activated.count === 0) return;
  }

  await recordAuditEvent({ action: "JOB_UPDATED", actorId: null, actorRole: "ADMIN", resource: "job", resourceId: parsed.data.jobId });
  revalidateTag("admin-jobs", "max");
}

export async function getReports(pagination?: { cursor?: string; limit?: number }) {
  await requireAuth(["ADMIN"]);
  const limitVal = pagination?.limit ?? PAGE_SIZE;
  const items = await prisma.report.findMany({
    select: {
      id: true,
      status: true,
      targetType: true,
      targetId: true,
      reason: true,
      createdAt: true,
      reporter: { select: { name: true, phone: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limitVal + 1,
    ...(pagination?.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
  });
  return buildPaginatedResponse(items, limitVal);
}

export async function updateReportStatus(reportId: string, status: "REVIEWED" | "DISMISSED") {
  await requireAuth(["ADMIN"]);

  const parsed = updateReportStatusSchema.safeParse({ reportId, status });
  if (!parsed.success) return;

  await prisma.report.update({ where: { id: parsed.data.reportId }, data: { status: parsed.data.status } });
  await recordAuditEvent({ action: "REPORT_RESOLVED", actorId: null, actorRole: "ADMIN", resource: "report", resourceId: parsed.data.reportId, newValues: { status: parsed.data.status } });
  revalidateTag("admin-reports", "max");
}

export async function getCategories(pagination?: { cursor?: string; limit?: number }) {
  const limitVal = pagination?.limit ?? PAGE_SIZE;
  const items = await (
    pagination?.cursor
      ? prisma.category.findMany({
          select: { id: true, name: true, slug: true },
          orderBy: [{ name: "asc" }, { id: "asc" }],
          take: limitVal + 1,
          cursor: { id: pagination.cursor }, skip: 1,
        })
      : cached(cacheKey("categories"), () =>
          prisma.category.findMany({
            select: { id: true, name: true, slug: true },
            orderBy: [{ name: "asc" }, { id: "asc" }],
          }),
        { ttl: 600 })
  );
  return buildPaginatedResponse(items, limitVal);
}

export async function createCategory(name: string) {
  await requireAuth(["ADMIN"]);

  const parsed = createCategorySchema.safeParse({ name });
  if (!parsed.success) return;

  const slug = parsed.data.name.toLowerCase().replace(/\s+/g, "-");
  await prisma.category.create({ data: { name: parsed.data.name, slug } });
  await recordAuditEvent({ action: "SYSTEM", actorId: null, actorRole: "ADMIN", resource: "category", newValues: { name: parsed.data.name, slug } });
  await invalidateCache("cache:categories");
  revalidateTag("admin-categories", "max");
}

export async function deleteCategory(id: string) {
  await requireAuth(["ADMIN"]);

  const parsed = idParamSchema.safeParse({ id });
  if (!parsed.success) return;

  await prisma.category.delete({ where: { id: parsed.data.id } });
  await recordAuditEvent({ action: "SYSTEM", actorId: null, actorRole: "ADMIN", resource: "category", resourceId: parsed.data.id });
  await invalidateCache("cache:categories");
  revalidateTag("admin-categories", "max");
}

export async function getCities() {
  await requireAuth(["ADMIN"]);
  return cached(cacheKey("cities"), () =>
    prisma.city.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
  { ttl: 600 });
}

export async function createCity(name: string) {
  await requireAuth(["ADMIN"]);

  const parsed = createCitySchema.safeParse({ name });
  if (!parsed.success) return;

  const slug = parsed.data.name.toLowerCase().replace(/\s+/g, "-");
  await prisma.city.create({ data: { name: parsed.data.name, slug } });
  await recordAuditEvent({ action: "SYSTEM", actorId: null, actorRole: "ADMIN", resource: "city", newValues: { name: parsed.data.name, slug } });
  await invalidateCache("cache:cities");
  revalidateTag("admin-cities", "max");
}

export async function deleteCity(id: string) {
  await requireAuth(["ADMIN"]);

  const parsed = idParamSchema.safeParse({ id });
  if (!parsed.success) return;

  await prisma.city.delete({ where: { id: parsed.data.id } });
  await recordAuditEvent({ action: "SYSTEM", actorId: null, actorRole: "ADMIN", resource: "city", resourceId: parsed.data.id });
  await invalidateCache("cache:cities");
  revalidateTag("admin-cities", "max");
}
