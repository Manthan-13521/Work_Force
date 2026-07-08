import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (!globalThis.prisma) {
    globalThis.prisma = createPrismaClient();
  }
  if (process.env.NODE_ENV !== "production") globalThis.prisma = globalThis.prisma;
  return globalThis.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, key) {
    return getPrisma()[key as keyof PrismaClient];
  },
});
