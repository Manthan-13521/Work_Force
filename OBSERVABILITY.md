# Observability Platform

## Overview

Workforce uses a layered observability stack:
- **Sentry** — error tracking, performance monitoring, profiling
- **Structured JSON logging** — all services, with PII redaction
- **Request correlation** — `X-Request-Id` propagated through middleware, actions, and logs
- **Health endpoints** — `/api/health`, `/api/ready`, `/api/live`
- **Metrics** — periodic snapshots of operation latencies and failure rates

## Architecture

```
Request → Middleware (proxy.ts)
           ├─ Generates X-Request-Id
           ├─ Sets request context (userId, role, path)
           ├─ Adds security headers
           └─ Routes to page/API/action

Server Action → action-wrapper.ts
                ├─ Records span timing
                ├─ Logs success/failure with context
                └─ Captures metrics

External Service → circuit-breaker.ts + timeout.ts
                   ├─ Wraps SMTP, Cloudinary calls
                   ├─ Records latency metrics
                   └─ Falls back gracefully on failure

Prisma Query → middleware (prisma.ts)
               ├─ Logs slow queries (>250ms)
               ├─ Captures error events
               └─ Writes structured logs

Logger → logger.ts
         ├─ PII redaction (phone, OTP, secrets)
         ├─ Request context injection
         └─ AUDIT/SECURITY levels

Metrics → observability.ts
          ├─ 60-second aggregation window
          ├─ Count, avg latency, failures per operation
          └─ Logged as structured JSON snapshot
```

## Trace Flow

1. **Proxy** generates `requestId` via `generateRequestId()`
2. Sets `X-Request-Id` response header
3. Stores context (`path`, `method`, `userId`, `role`) in request context store
4. Logger reads `__requestId` from global scope
5. Server actions use `withActionSpan()` for automatic timing/logging
6. Sentry captures errors with request context

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/tracer.ts` | Request ID generation, context store, latency statistics |
| `src/lib/logger.ts` | Structured logger with AUDIT/SECURITY levels, PII redaction |
| `src/lib/observability.ts` | Metrics aggregation, span timing, request scope management |
| `src/lib/action-wrapper.ts` | Server action wrapper for auto-timing and logging |
| `src/lib/circuit-breaker.ts` | Circuit breaker pattern for external services |
| `src/lib/timeout.ts` | Promise timeout helper |
| `src/instrumentation.ts` | Sentry initialization |
| `sentry.server.config.ts` | Server-side Sentry config |
| `sentry.client.config.ts` | Client-side Sentry config (with Replays) |
| `sentry.edge.config.ts` | Edge runtime Sentry config |

## Metrics Collected

| Metric | Source | Format |
|--------|--------|--------|
| Prisma query latencies | `prisma.ts` middleware | `prisma:{model}.{action}` |
| SMTP email timing | `email/provider.ts` | `smtp.email.send` |
| Cloudinary upload timing | `upload.actions.ts` circuit breaker | `cloudinary.upload` |
| Server action timing | `action-wrapper.ts` | `action:{name}` |
| Database latency | `/api/health` | Reported in health check |
| Redis latency | `/api/health` | Reported in health check |

## PII Protection

Never logged:
- Phone numbers (redacted to `98******10`)
- OTP codes (redacted to `******`)
- JWT tokens
- Cookies/Authorization headers
- Database URLs
- Payment secrets

Achieved via `sanitizePayload()` in `logger.ts` and `beforeSend` in Sentry config.
