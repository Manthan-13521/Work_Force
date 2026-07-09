import { prisma } from "./prisma";
import { logger } from "./logger";

const JOBVIEW_RETENTION_DAYS = 90;
const INACTIVE_USER_DAYS = 365;

class BackgroundTaskScheduler {
  private lastRun: Record<string, number> = {};
  private minIntervalMs = 30000;

  private shouldRun(name: string): boolean {
    const now = Date.now();
    const last = this.lastRun[name] || 0;
    if (now - last < this.minIntervalMs) return false;
    this.lastRun[name] = now;
    return true;
  }

  async markExpiredJobs(): Promise<number> {
    if (!this.shouldRun("markExpiredJobs")) return 0;
    const result = await prisma.job.updateMany({
      where: { status: "ACTIVE", expiresAt: { lte: new Date() } },
      data: { status: "EXPIRED" },
    });
    if (result.count > 0) {
      logger.info("Expired jobs marked", { count: result.count });
    }
    return result.count;
  }

  async cleanupOldJobViews(): Promise<number> {
    if (!this.shouldRun("cleanupOldJobViews")) return 0;
    const cutoff = new Date(Date.now() - JOBVIEW_RETENTION_DAYS * 86400000);
    const result = await prisma.jobView.deleteMany({ where: { viewedAt: { lt: cutoff } } });
    if (result.count > 0) {
      logger.info("Old job views cleaned up", { count: result.count });
    }
    return result.count;
  }

  async cleanupInactiveUsers(): Promise<number> {
    if (!this.shouldRun("cleanupInactiveUsers")) return 0;
    const cutoff = new Date(Date.now() - INACTIVE_USER_DAYS * 86400000);
    const inactive = await prisma.user.findMany({
      where: {
        createdAt: { lt: cutoff },
        role: "WORKER",
        applications: { none: {} },
      },
      select: { id: true },
      take: 100,
    });
    if (inactive.length === 0) return 0;
    const ids = inactive.map((u) => u.id);
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.workerProfile.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    logger.info("Inactive users cleaned up", { count: ids.length });
    return ids.length;
  }

  async runAll(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    results.expiredJobs = await this.markExpiredJobs();
    results.oldViews = await this.cleanupOldJobViews();
    results.inactiveUsers = await this.cleanupInactiveUsers();
    return results;
  }
}

export const backgroundTasks = new BackgroundTaskScheduler();
