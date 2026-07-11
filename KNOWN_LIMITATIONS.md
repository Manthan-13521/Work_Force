# Known Limitations & Accepted Risks

## Performance

| Limitation | Impact | When to Address |
|------------|--------|----------------|
| No full-text search on jobs (uses `contains` + `mode: insensitive`) | Slower on large datasets (>10K jobs) | After launch, add `pg_trgm` extension + GIN index |
| No CDN for static assets | Higher TTFB for global users | When serving users outside India |
| No persistent Redis in free tier | Rate limits/OTP reset on Vercel restart | When upgrading to paid Upstash plan |
| No database read replicas | Read queries compete with writes | At >500 concurrent users |
| `getWorkers` query sorts in memory | Poor performance with 10K+ verified workers | Add pagination with cursor support |
| Bundle size not optimized yet | Higher initial load time | Before public launch |

## Scalability

| Limitation | Impact | When to Address |
|------------|--------|----------------|
| No background job queue | Cleanup tasks run during HTTP requests | When serverless function timeout becomes an issue |
| In-memory Redis fallback per instance | Rate limits inconsistent across instances | When deploying multiple Vercel instances |
| No database read replica | Single point of failure for reads | When DB becomes bottleneck |
| Serverless function cold starts | Higher latency on infrequent endpoints | When traffic patterns require consistent response times |

## Reliability

| Limitation | Impact | When to Address |
|------------|--------|----------------|
| SMTP email delivery failure | Email OTP delivery fails silently | Already handled — OTP still stored in Redis, user sees error |
| Cloudinary circuit breaker + local fallback | Uploads use local filesystem (lost on redeploy) | Acceptable for MVP — Cloudinary is primary |
| No database transaction retry for Prisma | Rare deadlock could cause 500 error | Add Prisma retry wrapper if deadlocks appear |
| No chaos testing done | Unknown behavior under extreme failure | Before enterprise SLA |

## Security (Accepted Risks)

| Risk | Mitigation | Rationale |
|------|-----------|-----------|
| `'unsafe-inline'` in CSP | Common in Next.js apps | Nonce migration is a separate project |
| Phone numbers visible to employers | Required for contact | Documented in Privacy Policy |
| No rate limiting on webhook per origin | HMAC signature verification | Razorpay webhooks are signed |
| JWT tokens valid for 7 days | Short-lived by industry standards | Can be reduced to 24h if needed |

## Feature Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| No email notifications | Users only get in-app notifications | Medium |
| No password reset flow | Passwordless auth by design | Low |
| No export/import of data | Manual data portability | Low |
| No bulk operations for employers | Must post/edit jobs individually | Medium |
| No mobile app | PWA serves mobile use cases | Low |
