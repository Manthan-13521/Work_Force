# Workforce — Production Engineering Roadmap

Current maturity: **9.3/10**  
Target: **9.9+/10 Enterprise Production Grade**

---

## Phase A — Stability (Highest Priority)
_Nothing crashes._

- [ ] **Playwright E2E** — Worker register→OTP→apply, Employer register→buy→post→hire, Admin verify/suspend/resolve, Razorpay success/failure/duplicate, Uploads (image, ID, invalid, 6MB, MIME spoof)
- [ ] **Integration tests** — DB, Redis, webhook, server actions, transactions (target: 100+ tests)
- [ ] **Load testing** — k6 at 100/500/1000/5000 users for OTP, login, search, apply, payment, dashboard

## Phase B — Performance
_Optimize for scale._

- [ ] **Redis cache** — Categories, cities, homepage stats, featured jobs, popular searches, plans (TTL 5–30 min)
- [ ] **Background jobs** — Queue notifications, analytics, cache refresh, WhatsApp, email after applications
- [ ] **DB tuning** — `EXPLAIN ANALYZE` on every expensive query (target <20ms)
- [ ] **Connection pool** — Prisma pool size, prepared statements, timeouts
- [ ] **Images** — Cloudinary auto WebP/AVIF, responsive sizes, blur placeholder, lazy loading

## Phase C — Security
_Harden what's already strong._

- [ ] **JWT refresh tokens** — Device sessions, logout all devices, session management
- [ ] **Security audit logging** — Every login, payment, role change, verification, admin action
- [ ] **Rate limiting** — Per user/IP/endpoint/role, adaptive limits
- [ ] **Bot protection** — Cloudflare Turnstile on OTP, contact, registration
- [ ] **Secret rotation** — JWT, Razorpay, MSG91, Cloudinary keys

## Phase D — UX
_Drive adoption._

- [ ] **Worker** — Voice search, recent searches, saved filters, offline jobs, application timeline, daily wage calculator, maps/nearby jobs
- [ ] **Employer** — Kanban pipeline (applicants→interview→hired→rejected), bulk actions, CSV export, resume preview
- [ ] **Admin** — Realtime dashboard, charts, heatmaps, top employers/workers, spam detection

## Phase E — Monitoring
_See everything._

- [ ] **Sentry** — Frontend, backend, API, cron
- [ ] **Better Stack** — Logs, alerts, uptime
- [ ] **OpenTelemetry** — Request, DB, Redis, external API tracing
- [ ] **Health endpoints** — `/api/health`, `/api/ready`, `/api/live`
- [ ] **Daily reports** — Errors, slow queries, OTP failures, payments, applications

## Phase F — DevOps
_Ship safely._

- [ ] **GitHub Actions** — Build, lint, typecheck, tests, security scan, dep audit, deploy preview
- [ ] **Database** — Daily backup, weekly restore test, migration validation
- [ ] **Environments** — Preview, staging, production (separate DB/Redis/Cloudinary)
- [ ] **Feature flags** — LaunchDarkly or DB-backed
- [ ] **Blue/green deployment** — Rollback in seconds

## Business Improvements (High ROI)

- [ ] Referral program (₹500 per successful hire)
- [ ] Employer verification badge
- [ ] Worker trust score
- [ ] Application score
- [ ] Duplicate job detection
- [ ] Fraud detection
- [ ] Smart recommendations
- [ ] WhatsApp application updates
- [ ] Hiring analytics

## Technical Debt — Pre-launch Checklist

- [ ] 100% Playwright coverage for critical flows
- [ ] Integration tests for payments, uploads, auth, applications
- [ ] Sentry integrated and verified
- [ ] Cloudinary configured for production
- [ ] PostgreSQL backups tested
- [ ] Load-tested to 1,000+ concurrent users
- [ ] Monitoring dashboards and alerts configured
- [ ] CI/CD pipeline with automated quality gates
- [ ] Disaster recovery documented and tested
- [ ] Runbooks for incidents (payment failures, DB outages, Redis failures)

## Release Stages

1. ✅ Local verification — **DONE**
2. ⬜ Vercel Preview → full smoke test
3. ⬜ Private beta (10–20 employers, 50–100 workers)
4. ⬜ Closed production
5. ⬜ Public launch

## Post-Launch Success Metrics

| Metric | Target |
|--------|--------|
| Build success | 100% |
| Test pass rate | 100% |
| Lighthouse | ≥95 |
| API P95 latency | <200 ms |
| Error rate | <0.1% |
| Uptime | ≥99.9% |
| OTP success | >98% |
| Payment success | >99% |
| Job posting | <2 minutes |
| Worker application | <30 seconds |
| Time-to-hire | <48 hours |
