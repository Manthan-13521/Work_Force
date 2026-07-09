# Deployment Certificate

**Release**: v1.0.0-rc.1
**Date**: 2026-07-09
**Target**: `https://work-force1-ivory.vercel.app`
**Environment**: Production (Vercel + Neon + Upstash)

---

## Deployment Artifacts

| Artifact | Version | Location |
|----------|---------|----------|
| Application | v1.0.0-rc.1 | `workforce/` |
| Prisma Schema | v7 | `prisma/schema.prisma` |
| Database | PostgreSQL 16 | Neon project |
| Cache | Upstash Redis | Upstash project |
| Error Tracking | Sentry | Sentry project |
| CI/CD | GitHub Actions | `.github/workflows/ci.yml` |

## Pre-deployment Checklist

- [x] `npm run build` — ✅ Build passes
- [x] `npx tsc --noEmit` — ✅ TypeScript clean
- [x] `npm run lint` — ✅ ESLint clean
- [x] `npm test` — ✅ 113/113 passed
- [x] `npx playwright test` — ✅ 65/65 passed
- [ ] Production env vars set in Vercel — ⏭️ Manual
- [ ] `SENTRY_DSN` configured — ⏭️ Manual
- [ ] Neon connection verified — ⏭️ Manual
- [ ] Redis connection verified — ⏭️ Manual

## Deployment Command

```bash
# Vercel CLI (requires VERCEL_TOKEN and VERCEL_ORG_ID)
npx vercel deploy --prod \
  --token=$VERCEL_TOKEN \
  --scope=$VERCEL_ORG_ID \
  --build-env NODE_ENV=production
```

## Post-deployment Verification

```bash
# 1. Health check
curl https://workforce.app/api/health

# 2. Ready check
curl https://workforce.app/api/ready

# 3. Live check
curl https://workforce.app/api/live

# 4. Integration validation
npx tsx scripts/validate-integrations.ts --strict

# 5. Smoke test
k6 run k6/smoke-test.js -e BASE_URL=https://workforce.app

# 6. Sentry test
curl -X POST https://workforce.app/api/debug-sentry
```

## Rollback Procedure

### Vercel Rollback (Instant)
1. Go to Vercel Dashboard → Deployments
2. Find last known-good deployment
3. Click ⋮ → "Promote to Production"
4. Verify: `curl https://workforce.app/api/health`

### Git Rollback (If Code Fix Needed)
```bash
git revert HEAD --no-edit
git push origin main
```

## Certificate

I certify that this deployment has passed all automated quality gates and is being deployed as a Release Candidate for production validation.

**Release Engineer**: Automated Pipeline
**Date**: 2026-07-09
