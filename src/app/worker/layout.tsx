import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { cacheKey } from "@/lib/cache";
import { cached } from "@/lib/cache/cache";
import { TTL } from "@/lib/cache/ttl";
import { prisma } from "@/lib/prisma";
import { WorkerLayoutClient } from "@/components/layout/worker-layout-client";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "WORKER") {
    if (user.role === "EMPLOYER") redirect("/employer/dashboard");
    if (user.role === "ADMIN") redirect("/admin/dashboard");
  }

  const unreadNotifications = await cached(
    cacheKey("notifications:count", user.id),
    () => prisma.notification.count({ where: { userId: user.id, read: false } }),
    { freshTtl: TTL.NOTIFICATION_COUNT.fresh, staleTtl: TTL.NOTIFICATION_COUNT.stale },
  );

  return <WorkerLayoutClient unreadNotifications={unreadNotifications}>{children}</WorkerLayoutClient>;
}
