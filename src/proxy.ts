import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { env } from "@/env";
import { generateRequestId, setRequestContext, clearRequestContext } from "@/lib/tracer";
import { logger } from "@/lib/logger";

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
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
  "/robots.txt",
  "/sitemap.xml",
];

const apiWhitelist = ["/api/health", "/api/ready", "/api/live", "/api/otp", "/api/webhooks", "/api/logout"];

const rolePrefixes: Record<string, string[]> = {
  WORKER: ["/worker"],
  EMPLOYER: ["/employer"],
  ADMIN: ["/admin"],
};

function isLocalhost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";
  } catch {
    return false;
  }
}

function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  if (origin) {
    if (appUrl && origin === appUrl) return true;
    if (isLocalhost(origin)) return true;
    return false;
  }

  if (referer) {
    const refererOrigin = referer.split("/").slice(0, 3).join("/");
    if (appUrl && refererOrigin === appUrl) return true;
    if (isLocalhost(referer)) return true;
    return false;
  }

  return false;
}

export default function proxy(request: NextRequest) {
  const requestId = generateRequestId();
  const { pathname } = request.nextUrl;

  const safeBase = env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  setRequestContext(requestId, { requestId, path: pathname, method: request.method });

  const response = NextResponse.next();
  response.headers.set("X-Request-Id", requestId);

  try {
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/images") ||
      pathname.startsWith("/icons") ||
      pathname === "/favicon.ico" ||
      pathname === "/manifest.json" ||
      pathname === "/sw.js"
    ) {
      return addSecurityHeaders(response);
    }

    if (
      publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
      apiWhitelist.some((p) => pathname.startsWith(p))
    ) {
      return addSecurityHeaders(response);
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
      const loginUrl = new URL("/login", safeBase);
      loginUrl.searchParams.set("redirect", pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    setRequestContext(requestId, { requestId, path: pathname, method: request.method, userId: payload.userId, role: payload.role });

    for (const [role, prefixes] of Object.entries(rolePrefixes)) {
      if (prefixes.some((p) => pathname.startsWith(p)) && payload.role !== role) {
        return addSecurityHeaders(NextResponse.redirect(new URL("/", safeBase)));
      }
    }

    return addSecurityHeaders(response);
  } catch (error) {
    logger.error("Middleware error", { error: String(error) });
    clearRequestContext(requestId);
    return addSecurityHeaders(new NextResponse("Internal error", { status: 500 }));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
