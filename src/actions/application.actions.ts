"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updateTag } from "next/cache";
import { buildPaginatedResponse, PAGE_SIZE } from "@/lib/pagination";
import { applyToJobSchema, updateApplicationStatusSchema } from "@/lib/schemas";
import { Prisma } from "@/generated/prisma/client";

export async function applyToJob(jobId: string) {
  const user = await requireAuth(["WORKER"]);

  const parsed = applyToJobSchema.safeParse({ jobId });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { status: true, employerId: true, title: true },
  });
  if (!job || job.status !== "ACTIVE") return { error: "Job is not available" };

  try {
    await prisma.application.create({
      data: { jobId, workerId: user.id },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Already applied" };
    }
    throw e;
  }

  await prisma.notification.create({
    data: {
      userId: job.employerId,
      title: "New Application",
      message: `${user.name || "A worker"} applied to ${job.title}`,
      type: "APPLICATION",
    },
  });

  updateTag("applications");
  return { success: true };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "SHORTLISTED" | "REJECTED" | "HIRED"
) {
  const user = await requireAuth(["EMPLOYER"]);

  const parsed = updateApplicationStatusSchema.safeParse({ applicationId, status });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      workerId: true,
      job: { select: { employerId: true, title: true } },
    },
  });
  if (!application || application.job.employerId !== user.id) {
    return { error: "Unauthorized" };
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { status },
  });

  const employerProfile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    select: { companyName: true },
  });
  const companyName = employerProfile?.companyName || user.name || "Employer";
  const whatsappUrl = `https://wa.me/91${user.phone}?text=Hi%20${companyName.replace(/\s+/g, "%20")}%2C%20I%20was%20shortlisted%20for%20${application.job.title.replace(/\s+/g, "%20")}%20on%20Workforce`;

  if (status === "SHORTLISTED") {
    await prisma.notification.create({
      data: {
        userId: application.workerId,
        title: "Congratulations! You're Shortlisted",
        message: `You have been shortlisted for ${application.job.title} at ${companyName}. Contact the employer on WhatsApp: ${whatsappUrl}`,
        type: "SHORTLIST",
      },
    });
  }

  if (status === "HIRED") {
    await prisma.notification.create({
      data: {
        userId: application.workerId,
        title: "You're Hired!",
        message: `You have been hired for ${application.job.title} at ${companyName}. Contact them on WhatsApp: ${whatsappUrl}`,
        type: "HIRE",
      },
    });
  }

  if (status === "REJECTED") {
    await prisma.notification.create({
      data: {
        userId: application.workerId,
        title: "Application Update",
        message: `Your application for ${application.job.title} at ${companyName} was not selected. Keep applying to other jobs.`,
        type: "REJECT",
      },
    });
  }

  updateTag("applications");
  return { success: true };
}

export async function getWorkerApplications(pagination?: { cursor?: string; limit?: number }) {
  const user = await requireAuth(["WORKER"]);
  const limitVal = pagination?.limit ?? PAGE_SIZE;
  const items = await prisma.application.findMany({
    where: { workerId: user.id },
    select: {
      id: true,
      status: true,
      appliedAt: true,
      job: {
        select: {
          title: true,
          location: true,
          city: true,
          salaryMin: true,
          salaryMax: true,
          employer: {
            select: {
              name: true,
              phone: true,
              employerProfile: { select: { companyName: true } },
            },
          },
        },
      },
    },
    orderBy: [{ appliedAt: "desc" }, { id: "desc" }],
    take: limitVal + 1,
    ...(pagination?.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
  });
  return buildPaginatedResponse(items, limitVal);
}

export async function getJobApplications(jobId: string, pagination?: { cursor?: string; limit?: number }) {
  const user = await requireAuth(["EMPLOYER"]);
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { employerId: true },
  });
  if (!job || job.employerId !== user.id) throw new Error("Unauthorized");

  const limitVal = pagination?.limit ?? PAGE_SIZE;
  const items = await prisma.application.findMany({
    where: { jobId },
    select: {
      id: true,
      status: true,
      worker: {
        select: {
          id: true,
          name: true,
          phone: true,
          city: true,
          workerProfile: {
            select: {
              trade: true,
              experienceYears: true,
              expectedSalary: true,
              isVerified: true,
            },
          },
        },
      },
    },
    orderBy: [{ appliedAt: "desc" }, { id: "desc" }],
    take: limitVal + 1,
    ...(pagination?.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
  });
  return buildPaginatedResponse(items, limitVal);
}
