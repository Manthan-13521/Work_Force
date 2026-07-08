import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrisma(): PrismaClient {
  if (!globalThis.prisma) {
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
    globalThis.prisma = new PrismaClient({ adapter });
  }
  return globalThis.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, key) {
    return getPrisma()[key as keyof PrismaClient];
  },
});
