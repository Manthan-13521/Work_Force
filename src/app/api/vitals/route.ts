import { NextRequest, NextResponse } from "next/server";
import { cacheMetrics } from "@/lib/cache";

const vitalsBuffer: Array<Record<string, unknown>> = [];
const MAX_BUFFER = 100;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    vitalsBuffer.push(body);
    if (vitalsBuffer.length > MAX_BUFFER) vitalsBuffer.shift();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function GET() {
  const stats = cacheMetrics.stats();
  return NextResponse.json({
    vitals: { recent: vitalsBuffer.slice(-20), total: vitalsBuffer.length },
    cache: stats,
  });
}
