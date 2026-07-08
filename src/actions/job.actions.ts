"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { JobStatus } from "@/generated/prisma/enums";
import type * as Prisma from "@/generated/prisma/internal/prismaNamespace";
import { buildPaginatedResponse, PAGE_SIZE } from "@/lib/pagination";
import { updateJobStatusSchema } from "@/lib/schemas";

const postJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string(),
  location: z.string(),
  city: z.string().default("Hyderabad"),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  vacancies: z.coerce.number().min(1),
  shiftType: z.enum(["DAY", "NIGHT", "ROTATIONAL", "GENERAL"]),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  expiresAt: z.string().optional(),
});

export async function postJob(formData: FormData) {
  const user = await requireAuth(["EMPLOYER", "ADMIN"]);

  const raw = Object.fromEntries(formData);
  const parsed = postJobSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  if (user.role !== "ADMIN") {
    const credit = await prisma.jobCredit.findUnique({
      where: { employerId: user.id },
      select: { remaining: true, expiryDate: true },
    });

    if (!credit || credit.remaining < 1) {
      return { error: "No job credits remaining. Please purchase a plan." };
    }

    if (credit.expiryDate && credit.expiryDate < new Date()) {
      return { error: "Your job credits have expired. Please purchase a new plan." };
    }

    await prisma.$transaction([
      prisma.jobCredit.update({
        where: { employerId: user.id },
        data: { remaining: { decrement: 1 } },
      }),
      prisma.job.create({
        data: {
          employerId: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          location: parsed.data.location,
          city: parsed.data.city,
          salaryMin: parsed.data.salaryMin,
          salaryMax: parsed.data.salaryMax,
          vacancies: parsed.data.vacancies,
          shiftType: parsed.data.shiftType,
          jobType: parsed.data.jobType,
          expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        },
      }),
    ]);
  } else {
    await prisma.job.create({
      data: {
        employerId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        location: parsed.data.location,
        city: parsed.data.city,
        salaryMin: parsed.data.salaryMin,
        salaryMax: parsed.data.salaryMax,
        vacancies: parsed.data.vacancies,
        shiftType: parsed.data.shiftType,
        jobType: parsed.data.jobType,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });
  }

  revalidateTag("jobs", "max");
  redirect(`/employer/jobs`);
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const user = await requireAuth(["EMPLOYER", "ADMIN"]);

  const parsed = updateJobStatusSchema.safeParse({ jobId, status: status as string });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.job.update({
    where: { id: parsed.data.jobId, employerId: user.id },
    data: { status: parsed.data.status as JobStatus },
  });
  revalidateTag("jobs", "max");
}

export async function markJobExpired() {
  await prisma.job.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: new Date() },
    },
    data: { status: "EXPIRED" },
  });
}

export async function getJobs(
  filters?: {
    category?: string;
    city?: string;
    shiftType?: string;
    salaryMin?: number;
    search?: string;
  },
  pagination?: { cursor?: string; limit?: number }
) {
  await markJobExpired();
  const where: Prisma.JobWhereInput = { status: "ACTIVE" };

  if (filters?.category) where.category = filters.category;
  if (filters?.city) where.city = filters.city;
  if (filters?.shiftType) {
    if (filters.shiftType === "DAY" || filters.shiftType === "NIGHT" || filters.shiftType === "ROTATIONAL" || filters.shiftType === "GENERAL") {
      where.shiftType = filters.shiftType;
    }
  }
  if (filters?.salaryMin) where.salaryMin = { gte: filters.salaryMin };
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const limitVal = pagination?.limit ?? PAGE_SIZE;
  const items = await prisma.job.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      isFeatured: true,
      location: true,
      city: true,
      createdAt: true,
      salaryMin: true,
      salaryMax: true,
      vacancies: true,
      shiftType: true,
      employer: {
        select: { name: true, employerProfile: { select: { companyName: true, isVerified: true } } },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limitVal + 1,
    ...(pagination?.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
  });
  return buildPaginatedResponse(items, limitVal);
}

export async function getJobById(jobId: string) {
  await markJobExpired();
  return prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      isFeatured: true,
      status: true,
      salaryMin: true,
      salaryMax: true,
      location: true,
      city: true,
      vacancies: true,
      shiftType: true,
      description: true,
      createdAt: true,
      expiresAt: true,
      employerId: true,
      employer: {
        select: {
          name: true,
          employerProfile: { select: { companyName: true, isVerified: true } },
        },
      },
    },
  });
}

export async function getEmployerJobs(pagination?: { cursor?: string; limit?: number }) {
  const user = await requireAuth(["EMPLOYER"]);
  await markJobExpired();
  const limitVal = pagination?.limit ?? PAGE_SIZE;
  const items = await prisma.job.findMany({
    where: { employerId: user.id },
    select: {
      id: true,
      title: true,
      isFeatured: true,
      location: true,
      city: true,
      createdAt: true,
      status: true,
      _count: { select: { applications: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limitVal + 1,
    ...(pagination?.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
  });
  return buildPaginatedResponse(items, limitVal);
}
