import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { env } from "@/env";
import { generateRequestId, setRequestContext, clearRequestContext } from "@/lib/tracer";
import { logger } from "@/lib/logger";

const isDev = process.env.NODE_ENV === "development";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src https://checkout.razorpay.com",
  "report-uri /api/csp-report",
  "report-to csp-endpoint",
];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy": CSP_DIRECTIVES.join("; "),
  "Report-To": JSON.stringify({ group: "csp-endpoint", max_age: 10886400, endpoints: [{ url: "/api/csp-report" }] }),
};

function addSecurityHeaders(response: NextResponse, isAuthenticated = false) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  if (isAuthenticated) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
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

const SAFE_REDIRECT_PREFIXES = ["/", "/jobs", "/workers", "/pricing", "/about", "/contact"];

function isSafeRedirect(path: string): boolean {
  if (!path || path.startsWith("//")) return false;
  return SAFE_REDIRECT_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
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

    const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
    const isWhitelisted = apiWhitelist.some((p) => pathname.startsWith(p));

    if (isPublic || isWhitelisted) {
      return addSecurityHeaders(response);
    }

    // CSRF check for state-changing methods on authenticated routes
    // API whitelist handled above; all other mutating requests require origin validation
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      if (!isValidOrigin(request)) {
        return addSecurityHeaders(new NextResponse("CSRF validation failed", { status: 403 }));
      }
    }

    const token = request.cookies.get("workforce_token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload) {
      const redirectTo = isSafeRedirect(pathname) ? pathname : "/";
      const loginUrl = new URL("/login", safeBase);
      loginUrl.searchParams.set("redirect", redirectTo);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    setRequestContext(requestId, { requestId, path: pathname, method: request.method, userId: payload.userId, role: payload.role });

    for (const [role, prefixes] of Object.entries(rolePrefixes)) {
      if (prefixes.some((p) => pathname.startsWith(p)) && payload.role !== role) {
        return addSecurityHeaders(NextResponse.redirect(new URL("/", safeBase)));
      }
    }

    return addSecurityHeaders(response, true);
  } catch (error) {
    logger.error("Middleware error", { error: String(error) });
    return addSecurityHeaders(new NextResponse("Internal error", { status: 500 }));
  } finally {
    clearRequestContext(requestId);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
