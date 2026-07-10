# Scalability Scorecard

## Current Architecture Limits

| Dimension | Current Capacity | Bottleneck |
|-----------|-----------------|------------|
| Concurrent users | ~1,000 (single instance) | Database connections |
| Daily requests | ~100k | Database query throughput |
| Jobs | 100k+ | Indexed; cursor pagination handles scale |
| Applications | 500k+ | Indexed; unique constraint prevents duplicates |
| Workers | 100k+ | Verified worker profiles indexed |
| Payments | 50k+ | Razorpay handles merchant of record |

## Scaling Strategy

### Horizontal Scaling (Application)
- Stateless application servers (no local state)
- Session stored in JWT cookies (no server-side sessions)
- Redis for distributed caching and rate limiting
- Health checks for load balancer integration

### Database Scaling
- **First bottleneck**: Connection pool (increase pool size, add PgBouncer)
- **Second bottleneck**: Query throughput (add read replicas)
- **Third bottleneck**: Data volume (archive old data, partition by date)

### Redis Scaling
- Upstash Redis handles scaling automatically
- Keyspace can grow to millions of entries
- Consider separate Redis instance for cache vs rate limiting at scale

### Image Storage
- Cloudinary handles CDN scaling
- Implement client-side image compression at upload (reduce originals)

## Recommendations for Next Growth Stage

### 10,000+ Users
- Add read replicas for dashboard queries
- Implement database connection pooling
- Consider Vercel Pro/Enterprise for hosting
- Implement background job processing for notifications

### 100,000+ Users
- Shard database by region or tenant ID
- Implement CDN caching for static API responses
- Add dedicated Redis for rate limiting vs caching
- Implement async payment webhook processing via job queue
