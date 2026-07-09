# Production Runbook

> Version: 1.0.0-rc
> Response SLO: 5min critical, 15min warning, 1hr informational

---

## Access & Logins

| Service | URL | Access Method |
|---------|-----|---------------|
| Vercel | https://vercel.com/.../workforce | GitHub OAuth |
| Neon | https://console.neon.tech | Email/password |
| Upstash | https://console.upstash.com | Email/password |
| Sentry | https://sentry.io | Email/password |
| Razorpay | https://dashboard.razorpay.com | Email/password |
| MSG91 | https://control.msg91.com | Email/password |
| Cloudinary | https://console.cloudinary.com | Email/password |
| Status page | https://status.workforce.app | PagerDuty OAuth |

**On-call engineer**: rotate weekly. Handoff includes: current incidents, recent deploys, env var changes.

---

## Incident Severity Levels

| Level | Label | Response Time | Example |
|-------|-------|--------------|---------|
| P0 | Critical | 5min | Site down, data loss, payment failure |
| P1 | High | 15min | Partial outage, high error rate |
| P2 | Medium | 1hr | Feature broken, non-critical |
| P3 | Low | 24hr | Cosmetic, non-functional |

---

## Runbook: Site Down (P0)

### Detection
- Vercel 502/503 errors
- Health endpoint non-responsive
- User reports via status page
- Sentry alert: availability < 99.9%

### Triage (first 2 minutes)
1. Check Vercel dashboard: recent deploy?
   - If yes: rollback to last known-good deployment
   - If no: check status.vercel.com for platform issues
2. Check `/api/health` — if down, proceed to database

### Database Check (next 2 minutes)
```bash
# Check Neon status
neonctl projects list
neonctl branches get main

# Check connection count
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

- If connection pool exhausted: scale pool in Neon dashboard
- If database unreachable: check Neon status page, initiate DR

### Redis Check (1 minute)
```bash
curl -s -X GET "$UPSTASH_REDIS_REST_URL/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

- If down: check Upstash status. App degrades gracefully (no rate limiting, no cache) but should NOT crash.

### Resolution
- Rollback? Done via Vercel: Deployment → ⋮ → Rollback
- Restart? Trigger new deploy with empty cache
- Fix forward? Create hotfix branch, push, CI deploys

**Post-mortem**: within 24h. Template in `POSTMORTEM_TEMPLATE.md`.

---

## Runbook: High Error Rate (P0/P1)

### Detection
- Sentry alert: error rate > 1%
- Vercel function error spike
- User reports

### Triage (5 minutes)
1. Open Sentry → Issues → filter by environment=production
2. Sort by count, check for new error since last deploy
3. Examine stack trace, affected URL, user agent
4. Check recent deploy: `git log --oneline -10`
5. If deploy caused it → rollback immediately

### Common Patterns
| Error Pattern | Likely Cause | Action |
|--------------|-------------|--------|
| `PrismaClientKnownRequestError` | DB schema mismatch | Run `prisma db push` |
| `MSG91 circuit breaker open` | MSG91 API down | Check MSG91 status, wait |
| `Cloudinary.*403` | API key rotated | Update env var, redeploy |
| `Razorpay.*authentication` | Key mismatch | Check RAZORPAY_KEY_SECRET |
| `fetch failed` | Upstream DNS | Check Cloudinary/MSG91 |
| `JWT expired` | Clock skew | Check server time |
| `TypeError: Cannot read` | API contract mismatch | Check response shape |

### Resolution
1. If new code: rollback or revert
2. If config: update env var, redeploy
3. If dependency: pin version, redeploy
4. If transient: monitor 5min, close if self-resolved

---

## Runbook: Payment Failure (P0)

### Detection
- Sentry alert: payment failure rate > 5%
- Razorpay webhook failure
- User reports "payment failed"

### Triage (5 minutes)
1. Check Razorpay dashboard: recent transactions
   - Filter by status=failed, last 30min
   - Note error code (e.g., `BAD_REQUEST`, `AUTHORIZATION_FAILED`)
2. Check Sentry: webhook handler errors
   - `src/app/api/webhooks/razorpay/route.ts`
3. Check database: `SELECT * FROM payment WHERE status='failed' AND created_at > NOW() - INTERVAL '30 minutes'`

### Common Razorpay Errors
| Error | Cause | Fix |
|-------|-------|-----|
| `BAD_REQUEST_ERROR` | Invalid payload | Check webhook signature |
| `GATEWAY_ERROR` | Bank declined | No action needed (user retry) |
| `AUTHORIZATION_FAILED` | API key expired | Rotate keys |
| `ORDER_NOT_FOUND` | Order ID mismatch | Check order creation |

### Resolution
1. If webhook: verify secret matches Razorpay dashboard
2. If keys: rotate, update env var, redeploy
3. If order creation: check `createRazorpayOrder()` in order creation code
4. If gateway: inform user to retry with different card

### Recovery
- For failed payments that succeeded in Razorpay but not in DB:
  ```sql
  UPDATE payment SET status = 'completed' WHERE razorpay_order_id = 'order_xxx' AND status = 'failed';
  ```

---

## Runbook: OTP Delivery Failure (P1)

### Detection
- Sentry alert: OTP failure rate > 5%
- User reports "OTP not received"
- Circuit breaker open for MSG91

### Triage (5 minutes)
1. Check MSG91 dashboard:
   - Credits remaining
   - Delivery reports for recent SMS
   - Sender ID approval status
2. Check circuit breaker status:
   ```bash
   curl $UPSTASH_REDIS_REST_URL/get/msg91-circuit-breaker \
     -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
   ```
3. Check Sentry: `msg91.send` errors

### Resolution
1. Out of credits → recharge MSG91 wallet
2. Circuit breaker open → wait for half-open timeout (30s)
3. API key rotated → update env var, redeploy
4. Sender ID rejected → contact MSG91 support

---

## Runbook: Database Incident (P0)

### Detection
- Connection pool exhausted
- Slow queries > 10s
- Deadlocks
- Disk space > 90%

### Connection Pool Exhaustion
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
-- Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < NOW() - INTERVAL '10 minutes';
```

- Increase pool size in Neon dashboard (max: 500)
- Add connection timeout: `?connection_limit=50&pool_timeout=10`

### Slow Queries
1. Find slow queries in Neon dashboard
2. Run `EXPLAIN ANALYZE` on the query
3. Check for missing indexes
4. Known slow patterns:
   - `WorkerProfile` without index on `isVerified` + `experienceYears` — should have composite index
   - `Notification` without index on `userId` + `read` + `createdAt` — should have composite index
   - Full-text search on large tables

### Disk Space
- Neon: auto-scales, but set up alert at 80%
- If full: archive old data:
  ```sql
  DELETE FROM notification WHERE created_at < NOW() - INTERVAL '90 days';
  VACUUM ANALYZE;
  ```

### Migration Failures
- `prisma db push` is safe (no downtime, no destructive changes by default)
- If migration fails:
  1. Check schema for conflicts
  2. Manual SQL fix via Neon SQL editor
  3. Retry `prisma db push --accept-data-loss` only if non-production

---

## Runbook: Redis Outage (P2)

### Detection
- Health endpoint shows Redis: fail
- Rate limiting stops working
- Cache disabled, DB load increases

### Impact Assessment
- OTP rate limiting → degraded but functional (in-memory fallback)
- Cached queries (public-stats, plans, categories, cities) → direct DB fallback
- Worker code storage → in-memory fallback

### Resolution
1. Check Upstash status page
2. Verify REST URL and token
3. Test: `curl -X GET "$UPSTASH_REDIS_REST_URL/ping" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"`
4. If Upstash down: wait for recovery (app degrades gracefully)
5. If config: update env var, redeploy

---

## Runbook: Security Incident (P0)

### Detection
- Suspicious activity in logs
- Unauthorized access detected
- Data breach notification
- DDoS / abuse pattern

### Immediate Actions (first 5 minutes)
1. **Do NOT** disclose publicly yet
2. Lock down: Vercel → Firewall → enable IP restriction or maintenance mode
3. Rotate all secrets: JWT_SECRET, RAZORPAY_KEY_SECRET, MSG91 keys, Cloudinary keys
4. Invalidate all sessions:
   ```sql
   UPDATE session SET expires_at = NOW() WHERE expires_at > NOW();
   ```
5. Check Sentry for unusual error patterns
6. Check Vercel access logs for suspicious IPs

### Investigation
1. Review Sentry events for the affected time range
2. Check Vercel deployment logs
3. Check Neon query logs for data exfiltration
4. Review GitHub access (who pushed what, when)
5. Preserve all logs before rotation

### Communication
1. Internal: security@workforce.app
2. Legal: if user data affected
3. Users: within 72h (regulatory requirement)
4. Law enforcement: if required

### Post-Incident
1. Full security audit
2. Update runbook with findings
3. Implement additional controls
4. Consider penetration test

---

## Deployment Procedure

### Pre-Deploy
```bash
# 1. Create release branch
git checkout -b release/v1.0.0

# 2. Run quality gate
npm run build && npm test && npm run lint

# 3. Verify env vars match production
diff .env.example <(echo "production env vars...")

# 4. Push
git push origin release/v1.0.0

# 5. Create PR → merge to main
gh pr create --title "Release v1.0.0" --body "See RELEASE_CHECKLIST.md"
```

### CI Trigger
On merge to `main`:
1. Lint → Unit Test → Build → E2E → Deploy (Vercel Production)
2. Monitor Sentry for 15min post-deploy

### Rollback
```bash
# Vercel CLI rollback
vercel rollback --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID

# Git revert
git revert HEAD --no-edit
git push origin main
```

---

## Monitoring Commands

### Health Check
```bash
curl -s https://workforce.app/api/health | jq .
```

### Quick Sentry Check
```bash
# Requires Sentry CLI
sentry-cli releases list
sentry-cli events list --environment production --limit 10
```

### Database Quick Check
```bash
psql $DATABASE_URL -c "
  SELECT relname, seq_scan, seq_tup_read, idx_scan
  FROM pg_stat_user_tables
  WHERE seq_scan > 1000
  ORDER BY seq_scan DESC
  LIMIT 10;
"
```

### Redis Quick Check
```bash
curl -s "$UPSTASH_REDIS_REST_URL/info" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" | jq .
```

### Logs (Vercel)
```bash
vercel logs --token=$VERCEL_TOKEN --scope=$VERCEL_ORG_ID \
  --status=error --limit=50
```

---

## Postmortem Template

```markdown
# Postmortem: [TITLE]

Date: YYYY-MM-DD
Severity: P0/P1/P2
Duration: X hours Y minutes
Impact: [users affected, errors, $ loss]

## Timeline
- HH:MM — Alert triggered
- HH:MM — Engineer acknowledged
- HH:MM — Root cause identified
- HH:MM — Mitigation applied
- HH:MM — All clear

## Root Cause
[One paragraph]

## Contributing Factors
- [Factor 1]
- [Factor 2]

## Resolution
[How it was fixed]

## Prevention
- [ ] Action item 1
- [ ] Action item 2
- [ ] Owner: @name by YYYY-MM-DD
```
