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
# Release Certification — v1.0.0-rc.1

**Certified By**: Release Engineering
**Date**: 2026-07-09
**Status**: 🔴 Release Candidate — Not Yet Production Ready

---

## Quality Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Build | ✅ 0 errors | 0 | ✅ |
| TypeScript | ✅ 0 errors | 0 | ✅ |
| ESLint | ✅ 0 warnings | 0 | ✅ |
| Unit Tests | 113/113 passed | 100% | ✅ |
| E2E Tests | 65/65 passed | 100% | ✅ |
| Test Coverage | ~75% (est.) | — | 🟡 |
| Performance (Lighthouse) | 74% | ≥95% | ❌ |
| Accessibility | 94% | ≥95% | 🟡 |
| Best Practices | 96% | ≥95% | ✅ |
| SEO | 91% | ≥95% | ❌ |

## Security Score

| Area | Score | Notes |
|------|-------|-------|
| Security Headers | 8/12 (deployed) / 12/12 (latest) | ✅ Post-deploy |
| CSP | ✅ Valid | Razorpay allowlisted |
| HSTS | ✅ Preload ready | `max-age=63072000` |
| Rate Limiting | ✅ Verified | OTP + logout |
| Auth + RBAC | ✅ Verified | Three-role isolation |
| CSRF | ✅ Origin validation | State-changing methods |
| Webhook Security | ✅ Code-level | Razorpay secret verification |
| OWASP ZAP | ⏭️ Not Run | Requires manual execution |

## Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| FCP | 1.3s | <1.8s | ✅ |
| LCP | 2.5s | <2.5s | ✅ |
| CLS | 0.688 | <0.1 | ❌ |
| TBT | 50ms | <200ms | ✅ |
| P95 (k6) | 352ms | <500ms | ✅ |

## Infrastructure Status

| Service | Status | Notes |
|---------|--------|-------|
| Vercel | ✅ Ready | Project configured |
| Neon PostgreSQL | ✅ Ready | Schema synced, indexes created |
| Upstash Redis | ✅ Ready | REST URL + token configured |
| Cloudinary | 🟡 Not verified | Needs credentials |
| MSG91 | 🟡 Not verified | Needs credentials |
| Razorpay | 🟡 Not verified | Needs credentials |
| Sentry | 🟡 Not verified | DSN needs to be set in Vercel |

## Known Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| CLS 0.688 (streaming) | Poor UX, low perf score | Certain | Add min-height to streaming content |
| robots.txt/sitemap.xml broken on deployed | SEO degradation | Certain (deployed) | Deploy latest code |
| No Sentry on deployed | Undetected errors | Certain (deployed) | Set SENTRY_DSN + deploy |
| Color contrast on muted text | Accessibility fail | High | Darken --muted-foreground |
| Unused JS (29 KiB) | Slower load | Low | Tree-shaking pass |
| Database not seeded | No initial data | Low (post-deploy) | Run seed script |

## Production Readiness Score

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Code Quality | 20% | 100% | 20.0 |
| Testing | 20% | 95% | 19.0 |
| Security | 20% | 85% | 17.0 |
| Performance | 15% | 70% | 10.5 |
| Accessibility | 10% | 94% | 9.4 |
| Infrastructure | 15% | 60% | 9.0 |

**Overall: 85/100** — Release Candidate. Not yet production ready.

## Required Before Production Launch

### Must Fix
1. Deploy latest code to resolve middleware whitelist, security headers, X-Request-Id ✅
2. Set SENTRY_DSN in Vercel environment
3. Fix CLS (min-height on streaming content)
4. Fix color contrast (`--muted-foreground` darkening)
5. Set all production credentials (Neon, Redis, Cloudinary, MSG91, Razorpay)

### Should Fix
6. Run OWASP ZAP baseline scan
7. Run 24h soak test
8. Run real device testing
9. Configure Sentry alerts
10. Configure Neon + Upstash dashboards

## Rollback Procedure

```bash
# Vercel: Instant rollback to last known-good deployment
vercel rollback --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID

# Git: Revert and force deploy
git revert HEAD --no-edit
git push origin main
```
