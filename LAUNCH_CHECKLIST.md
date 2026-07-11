# Production Launch Checklist

## Pre-Launch Verification

### Environment Variables
- [ ] `DATABASE_URL` — Neon connection string
- [ ] `JWT_SECRET` — 32+ character random string
- [ ] `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — from Razorpay dashboard
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` — same as KEY_ID
- [ ] `CLOUDINARY_CLOUD_NAME` + `API_KEY` + `API_SECRET` — from Cloudinary
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — from Upstash
- [ ] `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` + `EMAIL_FROM` — from email provider
- [ ] `SENTRY_DSN` — from Sentry project
- [ ] `NEXT_PUBLIC_APP_URL` — canonical production URL

### Database
- [ ] Run `npx prisma db push` to apply schema
- [ ] Run `npx tsx prisma/seed.ts` to seed plans + initial data
- [ ] Verify indexes are created (check Neon dashboard)
- [ ] Configure Neon connection pool limits (recommend: 50 connections)

### Build & Deploy
- [ ] `npm run build` passes
- [ ] `npm test` passes (113+ tests)
- [ ] `npm run lint` clean (0 warnings on src/)
- [ ] Deploy to Vercel preview environment first
- [ ] Verify `/api/health` returns 200
- [ ] Verify `/api/ready` returns 200
- [ ] Verify `/api/live` returns 200
- [ ] Test login flow end-to-end
- [ ] Test payment flow end-to-end
- [ ] Test upload flow end-to-end

### Security
- [ ] All env vars marked as sensitive in Vercel
- [ ] `JWT_SECRET` rotated from development value
- [ ] Razorpay webhook secret configured
- [ ] CSP headers verified via curl
- [ ] HSTS headers verified
- [ ] Sentry PII redaction verified

### Monitoring
- [ ] Sentry receiving events (deploy a test error)
- [ ] Sentry release tracking configured
- [ ] Sentry alerts configured for error rate > 1%
- [ ] Vercel dashboard accessible
- [ ] Neon slow query monitoring enabled
- [ ] Upstash dashboard accessible

## Launch Sequence

### Stage 1: Preview (1 day)
- Deploy to Vercel preview URL
- Internal team tests all flows
- Monitor Sentry for errors
- Check Neon query performance

### Stage 2: Private Beta (1 week)
- Deploy to production domain
- Invite 50 workers + 10 employers
- Monitor daily active users
- Track payment success rate
- Collect feedback on performance

### Stage 3: Limited Production (2 weeks)
- Open registration with soft rate limit
- Monitor:
  - DB connection pool usage
  - Redis command throughput
  - API response times (p95)
  - Error rates
- Scale Neon connections if needed
- Adjust Sentry sampling if traffic high

### Stage 4: Public Launch
- Remove rate limit caps
- Verify all metrics within SLOs
- Announce launch

## Rollback Plan

If critical issues detected post-launch:
1. Vercel: Rollback to last known-good deployment
2. Verify health endpoint
3. Communicate status to users
4. Fix issue in development
5. Deploy fix through staging pipeline

## Post-Launch Monitoring (First 72 Hours)

- Check Sentry every 4 hours
- Monitor Neon connection count
- Track payment success rate
- Verify OTP delivery rate
- Collect Core Web Vitals data
