import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/env";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("workforce_token");
  return NextResponse.redirect(new URL("/", env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
