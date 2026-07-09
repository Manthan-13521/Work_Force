import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/env";
import { checkRateLimit, getClientIp } from "@/lib/redis";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`rate:logout:${ip}`, 10, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const cookieStore = await cookies();
  cookieStore.delete("workforce_token");
  return NextResponse.redirect(new URL("/", env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
