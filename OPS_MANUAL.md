# Operations Manual

## Overview

Workforce is a Next.js 16 application running on Vercel with PostgreSQL (Neon), Redis (Upstash), Cloudinary (media), Razorpay (payments), MSG91 (SMS), and Sentry (monitoring).

## Architecture

```
User → Cloudflare/Vercel Edge → Next.js (Node.js) → PostgreSQL (Neon)
                                                      → Redis (Upstash)
                                                      → Cloudinary
                                                      → Razorpay API
                                                      → MSG91 API
                                                      → Sentry
```

## Key Services

| Service | Purpose | Failover |
|---------|---------|----------|
| PostgreSQL | Primary database | Neon PITR, connection pool retry |
| Upstash Redis | Rate limiting, OTP storage, cache | In-memory fallback per instance |
| Cloudinary | Image upload/storage | Local fallback, circuit breaker |
| Razorpay | Payment processing | Transaction idempotency |
| MSG91 | SMS delivery | OTP rate limiting |
| Sentry | Error tracking, performance | Failure-tolerant |

## Health Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /api/health` | Full health check (DB, Redis, deps) | `{"status":"ok",...}` |
| `GET /api/ready` | Readiness probe | `{"status":"ok"}` or 503 |
| `GET /api/live` | Liveness probe | `{"status":"alive"}` |

## Database

- **Provider**: PostgreSQL 16 via Prisma 7.8.0
- **Connection pool**: Managed by Prisma adapter (`@prisma/adapter-pg`)
- **Backup**: Neon point-in-time recovery (7-day retention)
- **Migration**: `npx prisma db push` (dev), `prisma migrate deploy` (prod)

### Connection Pool Configuration

For production:
```
max_connections = 200       # Current: 100 (default)
shared_buffers = 2GB        # Current: 128MB (default)
work_mem = 8MB              # Current: 4MB (default)
random_page_cost = 1.1      # Current: 4.0 (default HDD)
effective_io_concurrency = 2 # Current: 0 (default)
```

## Redis

- **Provider**: Upstash (HTTP-based, no persistent connection)
- **Fallback**: Per-instance in-memory Map (10K entry limit, FIFO eviction)
- **Key patterns**: `otp:{phone}`, `rate:{type}:{key}`, `cache:{key}`
- **No retry logic**: Single try-catch with immediate fallback

## Monitoring

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | >1% of requests | Page duty |
| p95 latency | >5s | Investigate |
| Payment failure | >5% of attempts | P0 incident |
| DB connections | >80% of pool | Scale up |
| Availability | <99.9% | P0 incident |

### Logging

- **Format**: Structured JSON
- **Levels**: DEBUG, INFO, AUDIT, SECURITY, WARN, ERROR
- **PII**: Automatic redaction (OTP, tokens, passwords, phone numbers)
- **Retention**: Vercel log stream (ephemeral), configure external sink for production

## Deployment

### CI/CD Pipeline

```
Build → Typecheck → Lint → Unit Tests → Invariant Tests → k6 Smoke → Certification → Deploy
```

### Rollback Procedure

1. Vercel dashboard → Select production deployment
2. Click "..." → "Promote to Production" on previous stable deployment
3. Verify health endpoints
4. Run invariant tests

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| DATABASE_URL | Yes | PostgreSQL connection |
| JWT_SECRET | Yes | JWT signing (min 32 chars) |
| RAZORPAY_KEY_ID | Yes | Payment processing |
| RAZORPAY_KEY_SECRET | Yes | Payment verification |
| RAZORPAY_WEBHOOK_SECRET | Yes | Webhook HMAC (falls back to KEY_SECRET) |
| UPSTASH_REDIS_REST_URL | No | Rate limiting (in-memory fallback) |
| UPSTASH_REDIS_REST_TOKEN | No | Redis auth |
| SENTRY_DSN | Recommended | Error tracking, performance monitoring |
| CLOUDINARY_* | No | Media uploads |
| MSG91_* | No | SMS delivery |
| NEXT_PUBLIC_APP_URL | Yes | CSRF origin validation, sitemap, redirects |

## Backup Verification

Database backups are managed via Neon PITR (7-day retention).
Verify backup integrity every Monday at 06:00 UTC:

```bash
# Automated (requires Neon API credentials):
bash scripts/verify-backup.sh

# Manual procedure guide:
bash scripts/verify-backup.sh --manual
```

Verification logs are stored in `tests/reporting/backup-verification.log`.
If verification fails, file a P1 incident.

## Incident Severity Levels

| Level | Definition | Response Time |
|-------|-----------|---------------|
| P0 | Service down, data loss | 15 minutes |
| P1 | Major feature broken | 1 hour |
| P2 | Minor feature degraded | 4 hours |
| P3 | Cosmetic / non-urgent | Next business day |
