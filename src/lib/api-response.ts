import { NextResponse } from "next/server";

type ApiResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false, error, ...(code ? { code } : {}) },
    { status }
  );
}

export function apiValidationError(errors: Record<string, string[]>) {
  return NextResponse.json({ success: false, error: "Validation failed", errors }, { status: 422 });
}

export function apiNotFound(message = "Resource not found") {
  return apiError(message, 404, "NOT_FOUND");
}

export function apiUnauthorized(message = "Unauthorized") {
  return apiError(message, 401, "UNAUTHORIZED");
}

export function apiForbidden(message = "Forbidden") {
  return apiError(message, 403, "FORBIDDEN");
}

export function apiServerError(message = "Internal server error") {
  return apiError(message, 500, "INTERNAL_ERROR");
}

export type { ApiResult };
