# Production Monitoring Guide

## Dashboards

### Sentry Dashboard
- **Errors**: Filter by environment, release, user
- **Performance**: Transaction traces, span details
- **Profiling**: CPU flame graphs for slow endpoints
- **Replays**: Session replays for user-reported issues (1% sample)

### Vercel Dashboard
- **Deployments**: Rollback, inspect, compare
- **Functions**: Duration, invocation count, cold starts
- **Edge**: Cache hit ratio, bandwidth
- **Logs**: Real-time streaming

### Neon Dashboard
- **Connections**: Active, idle, max
- **Queries**: Slow query log, duration
- **Storage**: Used vs allocated

### Upstash Dashboard
- **Commands/s**: Throughput
- **Latency**: p50/p95/p99
- **Keys**: Count, memory usage

## Alerting Rules (Recommended)

### Critical (Pager)
- Error rate > 1% over 5min
- API availability < 99.9%
- Database connection pool exhausted
- Payment failure rate > 5%

### Warning (Email/Slack)  
- Slow queries (>1s) detected
- Circuit breaker opens
- Redis fallback activated
- Memory > 80% of limit

## Runbook: Common Incidents

### High Error Rate
1. Check Sentry for new error group
2. Filter by environment, release
3. Check Vercel deployment status
4. Check Neon slow query log
5. Check if a recent deploy caused regression
6. Rollback if needed

### Slow API Responses
1. Check Sentry performance traces
2. Look for slow database queries
3. Check Neon query duration
4. Check Redis latency
5. Consider adding indexes

### Payment Failures
1. Check Razorpay dashboard
2. Check webhook logs in Sentry
3. Verify RAZORPAY_KEY_SECRET env var
4. Check database payment records

### OTP Delivery Issues
1. Check MSG91 dashboard credits
2. Check MSG91 circuit breaker status
3. Verify MSG91 env vars
4. Check Redis connectivity

## Deployment Checklist

Pre-deployment:
- [ ] `npm run build` passes
- [ ] `npm test` passes (113+ tests)
- [ ] `npm run lint` is clean
- [ ] Prisma migrations are generated
- [ ] All env vars are set in Vercel

Post-deployment:
- [ ] `/api/health` returns 200
- [ ] Sentry shows new release
- [ ] Login flow works
- [ ] Payment flow works
- [ ] Upload flow works

## Log Query Examples

### Find all errors for a user
```
level=error userId=abc123
```

### Find slow operations
```
level=warn "Slow operation"
```

### Find rate limit events
```
level=warn "Rate limit"
```

### Find circuit breaker events
```
level=warn "circuit breaker" OR level=warn "Circuit breaker"
```

## Metrics Snapshot Format

Metrics are logged every 60 seconds in this format:
```json
{
  "level": "info",
  "message": "Metrics snapshot",
  "metrics": [
    { "metric": "prisma:User.findUnique", "count": 42, "avgMs": 5, "failures": 0 },
    { "metric": "msg91.send", "count": 3, "avgMs": 1200, "failures": 0 }
  ]
}
```
