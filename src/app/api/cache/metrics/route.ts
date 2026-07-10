import { NextResponse } from "next/server";
import { cacheMetrics, getInvalidationLog, memorySize } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = cacheMetrics.stats();

  return NextResponse.json({
    status: "ok",
    metrics: {
      ...stats,
      memoryEntries: memorySize(),
      recentInvalidations: getInvalidationLog().slice(-10),
    },
  });
}
