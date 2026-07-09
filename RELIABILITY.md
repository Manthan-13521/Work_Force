# Reliability Engineering

## Strategy

Workforce follows the **graceful degradation** pattern for all external dependencies:

```
Normal → Circuit Breaker CLOSED → Requests pass through
Failure → Circuit Breaker OPEN → Fallback activated
Recovery → Circuit Breaker HALF_OPEN → Test request → CLOSED
```

## External Dependencies

| Service | Failure Mode | Fallback | Recovery |
|---------|-------------|----------|----------|
| **Neon (Postgres)** | Connection timeout / query failure | 503 health check, error returned to user | Prisma auto-reconnects |
| **Upstash Redis** | Connection failure | In-memory Map fallback (rate limits, OTP) | Automatic when Redis available |
| **Cloudinary** | Upload timeout / failure | Local filesystem (`/public/uploads/`) | Retry on next upload |
| **MSG91** | SMS send failure | Silent failure — OTP still stored in Redis | Circuit breaker resets after 60s |
| **Razorpay** | Order creation timeout | `"Payment not configured"` error | Retry on next payment attempt |

## Circuit Breaker Configuration

| Service | Failure Threshold | Reset Timeout | Half-Open Max |
|---------|------------------|---------------|---------------|
| MSG91 (SMS) | 3 | 60s | 1 |
| Cloudinary | 3 | 30s | 1 |

## Timeout Configuration

| Operation | Timeout |
|-----------|---------|
| MSG91 API call | 5,000ms |
| Cloudinary upload | 15,000ms |
| Prisma query (slow threshold) | 250ms |

## Retry Policy

| Operation | Max Attempts | Backoff | Notes |
|-----------|-------------|---------|-------|
| MSG91 send | 3 (via `retry()`) | Linear (200ms, 400ms, 600ms) | Inside circuit breaker |
| Prisma queries | Driver-level | Auto | Postgres adapter handles retries |

## Background Tasks

Task scheduling follows a **cooldown-based** pattern suitable for serverless:

| Task | Cooldown | Trigger |
|------|----------|---------|
| `markExpiredJobs()` | 30s | On any job listing fetch |
| `cleanupOldJobViews()` | 30s | On `trackJobView()` |
| `cleanupInactiveUsers()` | 30s | On `runAll()` |

## Graceful Degradation Test Scenarios

### Redis Offline
- Rate limiting falls back to in-memory (per-instance, lost on restart)
- OTP storage falls back to in-memory (still functions within same instance)
- Warning logged on every fallback

### Cloudinary Offline
- Upload falls back to local filesystem
- Circuit breaker opens after 3 failures
- Logs warning on each fallback

### MSG91 Offline
- OTP generation still works (stored in Redis/memory)
- SMS delivery fails silently
- Circuit breaker prevents repeated calls after 3 failures
- User sees "Unable to send OTP" message

### Database Offline
- Health check returns 503
- All authenticated requests fail with error
- No caching layer exists yet (Phase 5 item)

## Health Endpoints

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `GET /api/health` | Full system health | DB, Redis, Cloudinary, MSG91, Razorpay, Sentry status |
| `GET /api/ready` | Readiness probe | DB + Redis connectivity |
| `GET /api/live` | Liveness probe | Always 200 if process is alive |

## SLO Targets (Recommended)

| Metric | Target |
|--------|--------|
| API availability (excluding maintenance) | 99.9% |
| Database query latency (p95) | <200ms |
| OTP delivery time (p95) | <5s |
| Payment processing (p95) | <3s |
| Error rate (5xx) | <0.1% |
