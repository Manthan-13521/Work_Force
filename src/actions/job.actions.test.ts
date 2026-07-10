import { describe, it, expect, vi } from "vitest";

const { mockJobCreditFindUnique, mockJobCreditUpdateMany } = vi.hoisted(() => ({
  mockJobCreditFindUnique: vi.fn(),
  mockJobCreditUpdateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((fn: any) => fn({
      job: { create: vi.fn() },
      jobCredit: {
        findUnique: mockJobCreditFindUnique,
        updateMany: mockJobCreditUpdateMany,
      },
    })),
    job: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    jobCredit: {
      findUnique: mockJobCreditFindUnique,
      updateMany: mockJobCreditUpdateMany,
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  redisSet: vi.fn(),
  redisGet: vi.fn(),
  redisDel: vi.fn(),
  checkRateLimit: vi.fn().mockResolvedValue(true),
  atomicReadDelete: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/background", () => ({
  backgroundTasks: {
    markExpiredJobs: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/schemas", () => ({
  updateJobStatusSchema: {
    safeParse: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";
import { postJob, updateJobStatus, getJobs, getJobById } from "./job.actions";

describe("postJob", () => {
  it("returns validation error for invalid form data", async () => {
    vi.mocked(auth.requireAuth).mockResolvedValueOnce({ id: "emp-1", role: "EMPLOYER" } as any);
    const formData = new FormData();
    formData.set("title", "ab");

    const result = await postJob(formData);
    expect(result).toHaveProperty("error");
  });

  it("returns error when user has no job credits", async () => {
    vi.mocked(auth.requireAuth).mockResolvedValueOnce({ id: "emp-1", role: "EMPLOYER" } as any);
    mockJobCreditFindUnique.mockResolvedValueOnce(null);

    const formData = new FormData();
    formData.set("title", "Factory Worker Needed");
    formData.set("category", "Manufacturing");
    formData.set("location", "Hyderabad");
    formData.set("vacancies", "5");
    formData.set("shiftType", "DAY");
    formData.set("jobType", "FULL_TIME");

    const result = await postJob(formData);
    expect(result).toEqual({ error: "No job credits remaining. Please purchase a plan." });
  });
});

describe("updateJobStatus", () => {
  it("throws for unauthorized user", async () => {
    vi.mocked(auth.requireAuth).mockRejectedValueOnce(new Error("Unauthorized"));
    await expect(updateJobStatus("job-1", "ACTIVE" as any)).rejects.toThrow("Unauthorized");
  });

  it("allows employer to close own job", async () => {
    vi.mocked(auth.requireAuth).mockResolvedValueOnce({ id: "emp-1", role: "EMPLOYER" } as any);
    const { updateJobStatusSchema } = await import("@/lib/schemas");
    vi.mocked(updateJobStatusSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: { jobId: "job-1", status: "CLOSED" },
    } as any);
    const mockUpdate = vi.mocked(prisma.job.update);
    mockUpdate.mockResolvedValueOnce({} as any);

    await updateJobStatus("job-1", "CLOSED" as any);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "job-1", employerId: "emp-1" },
      data: { status: "CLOSED" },
    });
  });
});

describe("getJobs", () => {
  it("returns paginated results with default params", async () => {
    const mockFindMany = vi.mocked(prisma.job.findMany);
    mockFindMany.mockResolvedValueOnce([{ id: "job-1" }] as any);

    const result = await getJobs();
    expect(result.data).toHaveLength(1);
    expect(result.hasMore).toBe(false);
  });

  it("applies category filter", async () => {
    const mockFindMany = vi.mocked(prisma.job.findMany);
    mockFindMany.mockResolvedValueOnce([] as any);

    await getJobs({ category: "Manufacturing" });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: "Manufacturing" }),
      })
    );
  });

  it("applies cursor-based pagination", async () => {
    const mockFindMany = vi.mocked(prisma.job.findMany);
    mockFindMany.mockResolvedValueOnce([{ id: "job-2" }] as any);

    await getJobs({}, { cursor: "job-1", limit: 10 });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "job-1" },
        skip: 1,
        take: 11,
      })
    );
  });
});

describe("getJobById", () => {
  it("returns null for non-existent job", async () => {
    const mockFindUnique = vi.mocked(prisma.job.findUnique);
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await getJobById("non-existent");
    expect(result).toBeNull();
  });

  it("returns active job for unauthenticated user", async () => {
    const mockJob = { id: "job-1", title: "Welder", status: "ACTIVE", employerId: "emp-1", employer: { name: "Test Corp", employerProfile: { companyName: "Test Corp", isVerified: true } } };
    const mockFindUnique = vi.mocked(prisma.job.findUnique);
    mockFindUnique.mockResolvedValueOnce(mockJob as any);

    const result = await getJobById("job-1");
    expect(result).toEqual(mockJob);
  });

  it("returns null for non-active job when unauthenticated", async () => {
    const mockJob = { id: "job-1", title: "Welder", status: "CLOSED", employerId: "emp-1", employer: { name: "Test Corp", employerProfile: { companyName: "Test Corp", isVerified: true } } };
    const mockFindUnique = vi.mocked(prisma.job.findUnique);
    mockFindUnique.mockResolvedValueOnce(mockJob as any);

    const result = await getJobById("job-1");
    expect(result).toBeNull();
  });

  it("returns job for employer owner regardless of status", async () => {
    vi.mocked(auth.requireAuth).mockResolvedValueOnce({ id: "emp-1", role: "EMPLOYER" } as any);
    const mockJob = { id: "job-1", title: "Welder", status: "CLOSED", employerId: "emp-1", employer: { name: "Test Corp", employerProfile: { companyName: "Test Corp", isVerified: true } } };
    const mockFindUnique = vi.mocked(prisma.job.findUnique);
    mockFindUnique.mockResolvedValueOnce(mockJob as any);

    const result = await getJobById("job-1");
    expect(result).toEqual(mockJob);
  });

  it("returns null for another employer's non-active job", async () => {
    vi.mocked(auth.requireAuth).mockResolvedValueOnce({ id: "emp-2", role: "EMPLOYER" } as any);
    const mockJob = { id: "job-1", title: "Welder", status: "CLOSED", employerId: "emp-1", employer: { name: "Test Corp", employerProfile: { companyName: "Test Corp", isVerified: true } } };
    const mockFindUnique = vi.mocked(prisma.job.findUnique);
    mockFindUnique.mockResolvedValueOnce(mockJob as any);

    const result = await getJobById("job-1");
    expect(result).toBeNull();
  });

  it("returns job for admin regardless of status", async () => {
    vi.mocked(auth.requireAuth).mockResolvedValueOnce({ id: "admin-1", role: "ADMIN" } as any);
    const mockJob = { id: "job-1", title: "Welder", status: "SUSPENDED", employerId: "emp-1", employer: { name: "Test Corp", employerProfile: { companyName: "Test Corp", isVerified: true } } };
    const mockFindUnique = vi.mocked(prisma.job.findUnique);
    mockFindUnique.mockResolvedValueOnce(mockJob as any);

    const result = await getJobById("job-1");
    expect(result).toEqual(mockJob);
  });
});
