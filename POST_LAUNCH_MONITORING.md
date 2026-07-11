# Post-Launch Monitoring Plan

**Release**: v1.0.0-rc.1
**Duration**: First 72 hours post-deployment

---

## Monitoring Cadence

| Interval | Check | Action on Failure |
|----------|-------|-------------------|
| Every 15min | Sentry error rate | Investigate if >1% |
| Every 15min | `/api/health` | Page on-call if 503 |
| Every 1h | Neon connection count | Scale pool if >80% |
| Every 1h | Upstash command throughput | Scale if approaching limit |
| Every 4h | Vercel function duration p95 | Optimize if >2s |
| Every 4h | Payment success rate | Investigate if <98% |
| Every 4h | OTP delivery success | Check SMTP if <95% |
| Every 8h | Deploy a small change | Verify pipeline works |
| Every 12h | Memory trend | Investigate leak if growing |
| 24h | Full metrics review | All criteria must pass |
| 48h | User feedback review | Check support channels |
| 72h | Release stabilization | Declare stable or rollback |

---

## Dashboards

### Sentry
- **Error Rate**: Filter by environment=production
- **Performance**: Transaction traces for key endpoints
- **Releases**: Track version `v1.0.0-rc.1`

### Vercel
- **Functions**: Duration, invocations, cold starts
- **Edge**: Cache hit ratio
- **Logs**: Real-time streaming, filter by error

### Neon
- **Connections**: Active vs max
- **Slow Queries**: Duration > 500ms
- **Storage**: Used vs allocated

### Upstash
- **Commands/s**: Throughput chart
- **Latency**: p50/p95/p99
- **Keys**: Count and memory

---

## Alert Thresholds

| Alert | Severity | Threshold | Response |
|-------|----------|-----------|----------|
| High error rate | P0 | >1% over 5min | Page on-call |
| API unavailable | P0 | Health 503 for 2min | Page on-call |
| Payment failure | P0 | >5% failure rate | Page on-call |
| DB pool exhausted | P1 | >80% pool | Scale Neon |
| Slow queries | P1 | >1s duration | Check indexes |
| OTP failure | P1 | >5% failure | Check SMTP |
| Circuit breaker open | P2 | Any service | Check provider |
| Memory >80% | P2 | RSS limit | Investigate leak |

---

## Success Criteria (72h)

- [ ] Error rate < 1% for entire period
- [ ] No P0 incidents
- [ ] P95 latency < 2s
- [ ] Payment success > 98%
- [ ] OTP delivery > 95%
- [ ] DB connections stable (±20%)
- [ ] Memory stable (±10%)
- [ ] No circuit breaker trips
- [ ] No HTTP 503/504 errors
- [ ] All env vars verified in production

## Rollback Triggers

Rollback immediately if ANY of these occur:

1. Error rate > 5% for 5+ minutes
2. API unavailable for 2+ minutes
3. Payment failure rate > 10%
4. User data loss detected
5. Security vulnerability (any severity)
6. OTP delivery < 80% for 30+ minutes
