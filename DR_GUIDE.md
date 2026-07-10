# Disaster Recovery Guide

## Recovery Time Objectives

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Application crash | <30s | Zero | Vercel auto-restart |
| Redis outage | Instant | Zero | In-memory fallback activates immediately |
| Database crash | <5min | <5min | Neon PITR restore |
| Database corruption | <30min | <5min | Neon point-in-time recovery |
| Full region failure | <15min | <5min | DNS failover to secondary region |
| Payment gateway outage | Instant | Zero | Idempotency keys prevent double-charge |
| SMS provider outage | Instant | Zero | Rate limiting prevents abuse |

## Recovery Procedures

### Redis Unavailable

**Symptoms**: Health endpoint shows `redis: unavailable`, rate limiting on in-memory fallback.
**Impact**: Rate limits are per-instance (not global), OTP storage is in-memory (lost on restart).
**Recovery**:
1. No action needed — automatic fallback is active
2. Restart Upstash Redis
3. Traffic automatically resumes using Redis within one request
4. Verify health endpoint

### Database Crash

**Symptoms**: 5xx errors on all pages, health endpoint shows `database: error`.
**Impact**: Complete service unavailability.
**Recovery**:
1. Verify database connection string
2. Check Neon dashboard for service status
3. If Neon outage: wait for restore (usually <5min)
4. If connection issue: update DATABASE_URL
5. Restart application: `vercel redeploy`
6. Verify health: `GET /api/health`

### Database Corruption / Data Loss

**Symptoms**: Invariant tests fail, payment records inconsistent, credit ledger mismatched.
**Impact**: Business data integrity compromised.
**Recovery**:
1. Stop all traffic: Vercel → Disable Production Deployment
2. Go to Neon → Point-in-Time Recovery
3. Select timestamp before corruption (use Sentry error timestamp as reference)
4. Create new branch from that PITR point
5. Update DATABASE_URL to new branch
6. Verify data: run `npm run test:invariants`
7. Restore traffic
8. Post-mortem: identify root cause

### Payment Gateway Outage (Razorpay)

**Symptoms**: Payment creation fails, webhooks not delivered.
**Impact**: Users cannot purchase plans.
**Mitigation**:
1. Verify Razorpay dashboard for service status
2. Payment idempotency prevents double-charging on retry
3. No data loss: failed payments remain in PENDING state
4. After Razorpay recovery, users can retry
5. Manual reconciliation: run `npm run test:invariants` to detect inconsistencies

### Application Restart

**Procedure**:
1. Run invariant checks: `npm run test:invariants`
2. Run smoke test: `npm run test:smoke`
3. Deploy: `git push main`
4. Verify CI pipeline passes
5. Verify health endpoints
6. Monitor for 15 minutes
7. Rollback if error rate >1%

### Full Region Failure

**Procedure**:
1. Activate DNS failover (Cloudflare → secondary region)
2. Verify secondary region database is available (Neon replication)
3. Deploy to secondary region
4. Verify health endpoints
5. Update DNS TTL to 60s
6. Monitor for 1 hour
7. Post-mortem: identify root cause

## Backup Verification

Database backups are managed by Neon (PITR, 7-day retention).

### Automated Verification (requires Neon API credentials)

```bash
# Set required environment variables
export NEON_API_KEY="your-neon-api-key"
export NEON_PROJECT_ID="your-neon-project-id"

# Run automated verification
bash scripts/verify-backup.sh
```

The script:
1. Creates a Neon branch from the latest PITR (24h ago)
2. Runs all 21 business invariant tests against the restored data
3. Verifies data integrity (no negative credits, no orphaned payments)
4. Generates a backup verification report
5. Cleans up the temporary branch
6. Records the verification timestamp and result

### Manual Verification

```bash
# Print the manual procedure
bash scripts/verify-backup.sh --manual

# Or follow steps below:
# 1. Go to Neon Console → Branches → Create Branch
# 2. Source: Parent branch, Data from: Point in time (select <24h ago)
# 3. Get the connection string for the new branch
# 4. Run invariant tests:
#    DATABASE_URL="<restored-branch-url>" npm run test:invariants
# 5. Verify data integrity
# 6. Delete the temporary branch
# 7. Record verification date
```

### Schedule

- **Frequency**: Weekly (every Monday 06:00 UTC)
- **Retention**: Keep verification logs for 90 days
- **Alert**: If verification fails, create P1 incident
- **Record**: Last verification saved in `tests/reporting/backup-verification.log`

### Verification Log Format

```
2026-07-10T06:00:00Z | PASS | branch=backup-verify-20260710 | invariants=0 | data_checks=true
2026-07-03T06:00:00Z | PASS | branch=backup-verify-20260703 | invariants=0 | data_checks=true
```

## Invariant Verification

After ANY recovery, always run:
```
npm run test:invariants
npm run test:smoke
npm run certify
```

Certification must PASS before resuming traffic.

## Rollback Procedure

1. `vercel rollback --prod --yes`
2. Wait for deployment (30-60s)
3. `curl http://localhost:3000/api/health`
4. `npm run test:invariants`
5. If rollback is to a version with schema changes: `prisma migrate deploy`
6. Monitor error rate for 15 minutes
