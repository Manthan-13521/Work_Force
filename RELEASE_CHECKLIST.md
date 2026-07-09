# Release Checklist — RC → Production

> Current status: **Release Candidate (RC)**
> Score: **9.6–9.8/10** (engineering) — needs production validation

---

## Gate 1: Build & Test Quality
- [ ] `npm run build` passes (0 errors)
- [ ] `npx tsc --noEmit` passes (0 errors)
- [ ] `npm run lint` passes (0 warnings, 0 errors)
- [ ] `npm test` passes (113 unit tests)
- [ ] `npx playwright test` passes (~67 E2E tests)

## Gate 2: Infrastructure Validation
### Environment Variables (Vercel)
- [ ] `DATABASE_URL` — confirmed Neon connection string
- [ ] `JWT_SECRET` — rotated from dev, ≥32 chars
- [ ] `MSG91_AUTH_KEY` — from MSG91 dashboard
- [ ] `MSG91_SENDER_ID` — e.g., WRKFRC
- [ ] `MSG91_TEMPLATE_ID` — verified OTP template
- [ ] `CLOUDINARY_CLOUD_NAME` — from Cloudinary
- [ ] `CLOUDINARY_API_KEY` — from Cloudinary
- [ ] `CLOUDINARY_API_SECRET` — from Cloudinary
- [ ] `RAZORPAY_KEY_ID` — from Razorpay (test/live)
- [ ] `RAZORPAY_KEY_SECRET` — from Razorpay
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` — matches KEY_ID
- [ ] `NEXT_PUBLIC_APP_URL` — canonical production URL
- [ ] `UPSTASH_REDIS_REST_URL` — from Upstash
- [ ] `UPSTASH_REDIS_REST_TOKEN` — from Upstash
- [ ] `SENTRY_DSN` — from Sentry project
- [ ] `LOG_LEVEL` — set to `info` in production
- [ ] No placeholder or example secrets remain
- [ ] All sensitive vars marked "Encrypted" in Vercel

### Connectivity Validation (run against deployed URL)
- [ ] Neon: `npx prisma db push` succeeds
- [ ] Neon: `npx tsx prisma/seed.ts` succeeds
- [ ] Upstash Redis: `redis-cli -u $UPSTASH_URL ping` returns PONG
- [ ] Cloudinary: upload a test image via API
- [ ] MSG91: send a test OTP
- [ ] Razorpay: create a test payment link
- [ ] Sentry: `Sentry.captureMessage("test")` appears in dashboard
- [ ] Vercel: `vercel logs` shows no startup errors

### Startup Validation
- [ ] Deploy triggers `instrumentation.ts` integration checks
- [ ] Health endpoints return 200: `/api/health`, `/api/ready`, `/api/live`
- [ ] All integrations report "ok" in startup logs

## Gate 3: Production Smoke Test
Run against deployed URL (not localhost):

### Auth Flow
- [ ] Homepage loads
- [ ] Login page renders
- [ ] OTP send returns 200
- [ ] OTP verify creates session
- [ ] Worker registration completes
- [ ] Employer registration completes
- [ ] Logout clears session

### Job Flow
- [ ] Job listing page loads with data
- [ ] Job detail page renders
- [ ] Employer creates job posting
- [ ] Job appears in search results

### Application Flow
- [ ] Worker can apply to job
- [ ] Employer sees applicants
- [ ] Application status updates

### Payment Flow
- [ ] Razorpay checkout loads
- [ ] Payment succeeds
- [ ] Webhook creates payment record
- [ ] Receipt/receipt page renders

### Dashboard
- [ ] Worker dashboard renders
- [ ] Employer dashboard renders
- [ ] Admin dashboard renders (if role exists)

### Notifications
- [ ] Notification appears after action
- [ ] Notifications page loads

### Uploads
- [ ] Avatar upload succeeds
- [ ] Document/image upload succeeds

## Gate 4: Load Testing
### Execution
- [ ] `k6 run k6/smoke-test.js` — no failures, p95 < 500ms
- [ ] `k6 run k6/sustained-load.js` — 30min at 200 RPS, no degradation
- [ ] `k6 run k6/stress-test.js` — ramps to 1000 VUs, p99 < 8s
- [ ] `k6 run k6/spike-test.js` — spikes to 2000 VUs, recovers cleanly
- [ ] `k6 run k6/soak-test.js` — 4+ hours sustained load

### Metrics to Monitor During Load Tests
- [ ] CPU < 70%
- [ ] Memory < 80%
- [ ] Database connection pool < 80%
- [ ] Database query latency p95 < 200ms
- [ ] Redis latency p95 < 50ms
- [ ] Cloudinary upload latency p95 < 2s
- [ ] Error rate < 1%
- [ ] P95 response time < 2s
- [ ] P99 response time < 5s
- [ ] Zero HTTP 503 or 504 errors
- [ ] Zero circuit breaker trips
- [ ] Redis fallback not activated

## Gate 5: Security Validation
- [ ] OWASP ZAP baseline scan: 0 HIGH, 0 MEDIUM
- [ ] Mozilla Observatory: score ≥ 100
- [ ] Security Headers (securityheaders.com): A rating
- [ ] SSL Labs: A or A+
- [ ] CSP reports (if configured): no violations
- [ ] HSTS preload check: passes
- [ ] No exposed `.env` or config files
- [ ] No sensitive data in client-side bundle
- [ ] JWT secret not exposed in source
- [ ] Razorpay webhook secret verified

## Gate 6: Database Validation
- [ ] Index usage confirmed via `EXPLAIN ANALYZE` on slow queries
- [ ] No sequential scans on large tables
- [ ] Connection pool: max 50, min 5
- [ ] Connection timeout: 10s
- [ ] Slow query threshold: 500ms, logged
- [ ] Lock contention: no deadlocks in test
- [ ] Transaction duration: all < 2s
- [ ] Migration strategy: `prisma db push` (no downtime)
- [ ] Backup: daily automated + point-in-time recovery enabled
- [ ] Restore: DR test completed successfully

## Gate 7: Monitoring & Observability
### Dashboards Configured
- [ ] Sentry: error rate, performance traces, release tracking
- [ ] Vercel: functions, edge, logs
- [ ] Neon: connections, slow queries, storage
- [ ] Upstash: commands/s, latency, memory

### Alerts Configured (Critical — Pager)
- [ ] Error rate > 1% over 5 min
- [ ] API availability < 99.9%
- [ ] DB connection pool exhausted
- [ ] Payment failure rate > 5%

### Alerts Configured (Warning — Slack/Email)
- [ ] Slow queries > 1s
- [ ] Circuit breaker opens
- [ ] Redis fallback activated
- [ ] Memory > 80%
- [ ] OTP failure rate > 5%
- [ ] Upload failure rate > 5%

### Logging
- [ ] Structured JSON logs verified
- [ ] Request ID correlation confirmed
- [ ] Metrics snapshot logging every 60s
- [ ] PII redaction verified in Sentry

## Gate 8: Operational Readiness
- [ ] Backup strategy documented and tested
- [ ] Restore drill completed within 4h RTO
- [ ] Rollback plan tested (Vercel instant rollback)
- [ ] Incident response runbook accessible
- [ ] On-call rotation established
- [ ] Deployment checklist in repo
- [ ] Release notes generated for v1.0.0
- [ ] Runbook printed / available offline

### Runbooks
- [ ] High error rate runbook exists
- [ ] Slow API response runbook exists
- [ ] Payment failure runbook exists
- [ ] OTP delivery failure runbook exists
- [ ] Database outage runbook exists
- [ ] Redis outage runbook exists
- [ ] Security incident runbook exists

## Gate 9: Real Device Testing
- [ ] Chrome on Android: all flows pass
- [ ] Samsung Internet: all flows pass
- [ ] Safari on iPhone (iOS 16+): all flows pass
- [ ] Firefox (desktop): all flows pass
- [ ] Edge (desktop): all flows pass
- [ ] Slow 3G throttling: pages load under 5s
- [ ] Offline/online transitions: no crash, graceful message
- [ ] PWA installation: installs and opens
- [ ] Camera upload: works on mobile
- [ ] Large upload (>10MB): works, shows progress
- [ ] OTP autofill: works on Android
- [ ] Payment flow: Razorpay checkout responsive

## Gate 10: Accessibility
- [ ] Lighthouse accessibility score ≥ 90
- [ ] Keyboard navigation: all interactive elements reachable
- [ ] Screen reader: forms announce labels
- [ ] Focus management: modals trap focus, restore on close
- [ ] Color contrast: all text passes AA
- [ ] Forms: errors announced, labels associated
- [ ] Dialogs: ARIA roles correct, dismissible

## Gate 11: 💀 24-Hour Production Soak Test
### Execution
- [ ] Run `k6 run k6/soak-test.js` for 24h against production URL
- [ ] Sustained load: 200–400 concurrent users
- [ ] Monitor every 4 hours

### Soak Test Pass Criteria
- [ ] Zero memory growth over 24h
- [ ] Zero error rate increase over 24h
- [ ] No latency degradation over 24h
- [ ] Database pool stable (±10%)
- [ ] Redis stable (±10% commands/s)
- [ ] Cloudinary stable (±10% upload time)
- [ ] Payment success rate > 98%
- [ ] OTP delivery success > 95%
- [ ] No circuit breaker trips
- [ ] No HTTP 503/504 errors

### Monitoring Cadence (During Soak)
| Interval | Check |
|----------|-------|
| Every 4h | Sentry error rate, new issues |
| Every 4h | Neon connection count, slow queries |
| Every 4h | Upstash command throughput |
| Every 4h | Vercel function duration p95 |
| Every 8h | Deploy a small change (e.g., copy update) |
| Every 12h | Check memory trends (no leak) |
| 24h mark | Full review: all criteria pass |

## Gate 12: Release Day
- [ ] All Gate 1–11 items complete
- [ ] Release tagged: `v1.0.0`
- [ ] Release notes published
- [ ] CHANGELOG.md updated
- [ ] User-facing status page ready (e.g., status.workforce.app)
- [ ] Communication drafted: users, stakeholders
- [ ] On-call engineer confirmed
- [ ] Rollback tested within 5min
- [ ] Production monitoring verified one final time

## Rollback Triggers
If during or after launch any of these occur:
1. Error rate > 5% for 5+ minutes
2. API unavailable for 2+ minutes
3. Payment processing fails > 10% of attempts
4. User data loss detected
5. Security vulnerability discovered (any severity)

→ Rollback immediately via Vercel, stabilize, investigate.

## Post-Launch Monitoring (72 Hours)
| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | < 1% | Monitor |
| P95 latency | < 2s | Optimize or scale |
| Payment success | > 98% | Investigate if lower |
| OTP delivery | > 95% | Check MSG91 |
| DB connections | < 80% pool | Scale Neon |
| Memory | < 80% | Investigate leak |
| Active users | Per baseline | Scale as needed |
