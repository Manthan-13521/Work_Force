# Incident Response Guide

## Incident Classification

| Severity | Definition | Examples | Response Time |
|----------|-----------|----------|---------------|
| P0 | Complete outage or data loss | Site down, payments failing, data corruption | 15 minutes |
| P1 | Major feature broken | Cannot post jobs, search broken, login failure | 1 hour |
| P2 | Minor feature degraded | Slow page loads, cosmetic issues, non-critical | 4 hours |
| P3 | Inconsequential | Typo, styling, non-functional | Next business day |

## Incident Response Lifecycle

### 1. Detection
- Automated: Sentry alert, Vercel monitoring, health check probes
- Manual: User reports, support tickets, monitoring dashboards

### 2. Triage (within 5 minutes)
1. Confirm incident: is error rate >1%? Are health checks failing?
2. Classify severity (P0-P3)
3. Declare if P0/P1: `#incidents` Slack channel
4. Assign incident commander

### 3. Diagnosis
1. Check Sentry for error patterns and stack traces
2. Check Vercel dashboard for CPU/memory/request spikes
3. Check health endpoint: `GET /api/health`
4. Check database: `SELECT * FROM pg_stat_activity WHERE state != 'idle'`
5. Check Redis dashboard (if configured)
6. Run invariant tests: `npm run test:invariants`

### 4. Mitigation
1. Apply mitigation (see playbooks below)
2. Verify: health endpoints respond correctly
3. Verify: invariants pass
4. Monitor for 15 minutes
5. If no improvement: escalate

### 5. Resolution
1. Confirm root cause
2. Apply permanent fix
3. Deploy fix through CI/CD
4. Verify certification passes
5. Close incident

### 6. Post-Mortem (within 48 hours)
1. Timeline of events
2. Root cause analysis
3. Action items with owners
4. Update playbooks
5. Schedule follow-up

## Incident Playbooks

### P0: Site Down
**Symptoms**: 5xx errors on all pages, health check fails.
**Checks**:
1. `curl https://[domain]/api/health`
2. Vercel dashboard → Deployment status
3. Neon dashboard → Service status
4. Check recent deployments for rollback target
**Actions**:
1. If Vercel issue: `vercel rollback --prod --yes`
2. If database issue: Restore from Neon PITR (see DR_GUIDE.md)
3. If DNS issue: Check Cloudflare status
4. Verify recovery: health endpoint + invariant tests

### P0: Data Corruption
**Symptoms**: Invariant tests fail, payment ledger inconsistent, credit counts wrong.
**Checks**:
1. `npm run test:invariants` — identify which invariants fail
2. Check recent database migrations
3. Check recent webhook deliveries
**Actions**:
1. Stop traffic: Vercel → Disable Production
2. Restore DB from pre-corruption PITR
3. Run invariant tests
4. Restore traffic
5. Investigate root cause (webhook replay? race condition? bug?)

### P0: Payment Failure
**Symptoms**: Users cannot purchase plans, webhook errors, double charges.
**Checks**:
1. Razorpay dashboard → Payment history
2. Webhook endpoint: check recent deliveries
3. Check payment idempotency keys
**Actions**:
1. Verify RAZORPAY_WEBHOOK_SECRET is configured
2. Verify webhook endpoint is correct in Razorpay dashboard
3. If double-charges: refund in Razorpay dashboard, fix credits manually
4. Run payment invariants: `npm run test:invariants` (checks payment processed once)

### P1: High Error Rate (>1%)
**Symptoms**: Error rate >1% over 5 minutes.
**Checks**:
1. Sentry → Issues → Sort by count
2. Identify most frequent error pattern
3. Check if error is from specific page/API/region
**Actions**:
1. Rollback if error correlates with recent deployment
2. Hotfix if error is isolated and fix is clear (<10 lines)
3. Otherwise: feature flag to disable affected feature
4. Schedule fix for next sprint

### P1: Slow Response (p95 >5s)
**Symptoms**: p95 response time exceeds 5 seconds.
**Checks**:
1. Vercel dashboard → Functions → Duration
2. Neon dashboard → Query performance
3. Check for slow queries: `SELECT * FROM pg_stat_activity`
4. Check for connection pool exhaustion
**Actions**:
1. If DB slow: check query plans, add missing indexes
2. If connection pool: increase max_connections
3. If Redis slow: check Upstash dashboard
4. If code issue: profile and optimize

### P2: OTP Delivery Failure
**Symptoms**: Users not receiving OTP SMS, rate limiting too aggressive.
**Checks**:
1. MSG91 dashboard → Delivery reports
2. Check MSG91_AUTH_KEY and template configuration
**Actions**:
1. Verify MSG91 API credentials
2. Check rate limit thresholds
3. Verify phone number format (Indian: 10 digits starting with 6-9)

### P2: Redis Performance Degradation
**Symptoms**: Rate limiting not working, OTP verification slow.
**Checks**:
1. Upstash dashboard → Command rate, latency
2. Check if in-memory fallback is active (health endpoint)
**Actions**:
1. If Redis unresponsive: automatic fallback is active
2. If Redis slow: check command patterns, hot keys
3. If Redis full: increase maxmemory

## Post-Mortem Template

```markdown
# Incident Post-Mortem: [TITLE]

**Date**: YYYY-MM-DD
**Severity**: P[0-3]
**Duration**: [start] → [end]
**Impact**: [users affected, data lost, $ impact]

## Timeline
- [TIME] — [Event]
- [TIME] — [Detection]
- [TIME] — [Response]
- [TIME] — [Resolution]

## Root Cause
[Technical explanation of what went wrong]

## Contributing Factors
- [Factor 1]
- [Factor 2]

## Action Items
- [ ] [Owner] — [Action] — [Due date]

## Prevention
- [How to prevent recurrence]

## Lessons Learned
- [What went well]
- [What could be improved]
```
