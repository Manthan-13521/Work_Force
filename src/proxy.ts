import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { env } from "@/env";

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  const isDev = process.env.NODE_ENV === "development";
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src https://checkout.razorpay.com`
  );
  return response;
}

const publicPaths = [
  "/",
  "/jobs",
  "/workers",
  "/pricing",
  "/about",
  "/contact",
  "/login",
  "/register",
  "/verify-otp",
];

const apiWhitelist = ["/api/health", "/api/otp", "/api/webhooks", "/api/logout"];

const rolePrefixes: Record<string, string[]> = {
  WORKER: ["/worker"],
  EMPLOYER: ["/employer"],
  ADMIN: ["/admin"],
};

function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  if (origin) {
    if (appUrl && origin.startsWith(appUrl)) return true;
    if (origin.startsWith("http://localhost")) return true;
    return false;
  }

  if (referer) {
    if (appUrl && referer.startsWith(appUrl)) return true;
    if (referer.startsWith("http://localhost")) return true;
    return false;
  }

  return false;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js"
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    apiWhitelist.some((p) => pathname.startsWith(p))
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // CSRF check for state-changing methods on authenticated routes
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    if (!isValidOrigin(request)) {
      return addSecurityHeaders(new NextResponse("CSRF validation failed", { status: 403 }));
    }
  }

  const token = request.cookies.get("workforce_token")?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  for (const [role, prefixes] of Object.entries(rolePrefixes)) {
    if (prefixes.some((p) => pathname.startsWith(p)) && payload.role !== role) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
