import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { cacheKey } from "@/lib/cache/keys";
import { cached } from "@/lib/cache/cache";
import { TTL } from "@/lib/cache/ttl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in";

  const jobs = await cached(
    cacheKey("sitemap:jobs"),
    () => prisma.job.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, updatedAt: true },
      take: 1000,
    }),
    { freshTtl: TTL.SITEMAP.fresh, staleTtl: TTL.SITEMAP.stale },
  );

  const jobUrls = jobs.map((job) => ({
    url: `${baseUrl}/jobs/${job.id}`,
    lastModified: job.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${baseUrl}/jobs`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${baseUrl}/workers`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    ...jobUrls,
  ];
}
