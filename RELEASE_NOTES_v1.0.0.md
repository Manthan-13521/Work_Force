# Release Notes — Workforce v1.0.0-rc.1

**Release Candidate** — July 9, 2026

---

## Overview

Workforce is a verified industrial labour hiring platform connecting factory workers with trusted employers in Hyderabad, India. This release candidate represents the first production-ready build of the platform.

## What's Included

### Core Platform
- Phone-based OTP authentication (login/register)
- Role-based profiles: Worker, Employer, Admin
- Job posting with search and filtering
- Worker applications and employer review
- Razorpay payment integration
- Cloudinary media uploads
- Real-time notifications

### Security
- OTP-based authentication (no passwords)
- JWT session management
- CSRF protection
- Rate limiting (OTP, logout)
- Security headers (CSP, HSTS, XFO, etc.)
- Circuit breaker for third-party APIs
- PII redaction in error monitoring

### Monitoring
- Sentry error tracking (server + client + edge)
- Structured JSON logging
- Request tracing (X-Request-Id)
- Health endpoints (/health, /ready, /live)
- Metrics snapshot logging
- Feature flags

### Infrastructure
- Next.js 16.2.9 (Turbopack)
- Prisma v7 + PostgreSQL (Neon)
- Upstash Redis (caching + rate limiting)
- 113 unit tests (Vitest)
- 65 E2E tests (Playwright)
- k6 load testing scripts
- GitHub Actions CI/CD

## Known Issues

| Issue | Impact | Workaround |
|-------|--------|------------|
| CLS 0.688 on homepage | Poor performance score | Adding min-height to streaming content |
| robots.txt/sitemap.xml redirect | SEO degraded | ✅ Fixed in latest code, needs deploy |
| Color contrast on muted text | Accessibility degraded | Darken --muted-foreground |
| No Sentry on deployed | Errors undetected | Set SENTRY_DSN env var |

## Deployment

```bash
# 1. Set production env vars in Vercel
# 2. Trigger CI: push to main
# 3. Verify health: curl https://workforce.app/api/health
# 4. Run: npx tsx scripts/validate-integrations.ts --strict
```

## Rollback

```bash
vercel rollback
```

## Previous Versions

This is the first release candidate. No prior versions exist.
