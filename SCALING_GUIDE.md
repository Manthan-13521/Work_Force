# Scaling Guide

## Architecture Scaling Model

Workforce uses a horizontally scalable architecture built on Vercel's edge network.

## Capacity Estimates

| Users | Instances | CPU | RAM | DB Connections | Redis Memory | Storage |
|-------|-----------|-----|-----|---------------|-------------|---------|
| 100 | 1 (pro) | 1 vCPU | 1GB | 20 | 50MB | 1GB |
| 500 | 1 (pro) | 2 vCPU | 2GB | 50 | 100MB | 5GB |
| 1,000 | 2 (pro) | 4 vCPU | 4GB | 100 | 200MB | 10GB |
| 5,000 | 5 (pro) | 10 vCPU | 10GB | 200 | 500MB | 50GB |
| 10,000 | 10 (pro) | 20 vCPU | 20GB | 400 | 1GB | 100GB |
| 50,000 | 25 (pro) | 50 vCPU | 50GB | 1000 | 5GB | 500GB |

## Load Test Results (100 concurrent VUs)

| Metric | Value |
|--------|-------|
| Average response time | 15ms |
| p95 response time | 59ms |
| Throughput | 18 req/s |
| Error rate (5xx) | 0% |

At 5,000 concurrent users with linear scaling: expected throughput ~900 req/s, p95 ~500ms with 10 instances.

## Bottlenecks

### Database
- **Sequential scans at scale**: Add indexes for high-frequency query patterns
- **Connection pool exhaustion**: Increase `max_connections` and pool size
- **Long-running transactions**: Use `$transaction` with timeouts

### Redis
- **Not a bottleneck**: HTTP-based Upstash with in-memory fallback
- **Memory growth**: Monitor key count, set `maxmemory-policy allkeys-lru`

### Application
- **Serverless cold starts**: Configure Vercel `minInstances` for critical paths
- **Memory leaks**: Monitor Vercel dashboard; the in-memory fallback LRU eviction prevents unbounded growth
- **Bundle size**: Static pages are prerendered, dynamic pages stream

## Infrastructure Recommendations

### PostgreSQL (Neon)
- **Compute**: Start with 2 CU (2 vCPU, 4GB RAM)
- **Storage**: Auto-scaling
- **Pooler**: Enable Neon connection pooler (PgBouncer-compatible)

### Redis (Upstash)
- **Tier**: Pro (100MB, 10K commands/sec)
- **Region**: Same as database (to minimize latency)

### Vercel
- **Plan**: Pro
- **Functions**: Node.js 20+, 1024MB memory
- **Min instances**: 1 for critical API routes
- **Regions**: iad1 (US East) + fra1 (Europe)

## Cost Projection (Monthly)

| Component | 1,000 users | 10,000 users | 50,000 users |
|-----------|-------------|--------------|--------------|
| Vercel Pro | $20 | $200 | $1,000 |
| Neon (PostgreSQL) | $19 | $89 | $349 |
| Upstash Redis | $0 | $9 | $29 |
| Cloudinary | $0 | $89 | $249 |
| MSG91 | $5 | $50 | $500 |
| Sentry | $0 | $26 | $99 |
| **Total** | **$44** | **$463** | **$2,226** |

## Optimizations for Scale

1. **Database**: Add coverage indexes once row count exceeds 10K per table
2. **Caching**: Implement Redis-based response caching for GET endpoints
3. **Background jobs**: Move `trackJobView` and `cleanupOldJobViews` to cron
4. **Image optimization**: Add `quality:auto`, `fetch_format:auto` to Cloudinary uploads
5. **Bundle**: Monitor bundle size with `next build --analyze`
