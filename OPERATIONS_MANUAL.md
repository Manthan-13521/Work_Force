# Operations Manual

## Health Endpoints

### GET /api/health
Returns comprehensive system health with per-component status.

**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2026-07-10T...",
  "components": {
    "database": { "status": "healthy", "latencyMs": 2 },
    "redis": { "status": "healthy", "latencyMs": 1 },
    "environment": { "status": "healthy", "latencyMs": 0 },
    "storage": { "status": "healthy", "latencyMs": 50 }
  },
  "environment": "production",
  "uptime": 3600
}
```
Returns HTTP 200 if healthy, 503 if any component is unhealthy.

### GET /api/ready
Returns readiness for traffic.

**Response:**
```json
{
  "ready": true,
  "checks": {
    "database": true,
    "redis": true,
    "environment": true
  },
  "timestamp": "2026-07-10T..."
}
```

### GET /api/live
Simple liveness probe.

**Response:** `{ "alive": true, "timestamp": "..." }`

## Audit Logs

### GET /api/audit-logs
Admin-only endpoint for retrieving audit trail.

**Query Parameters:**
- `actorId` — Filter by user ID
- `action` — Filter by action type (LOGIN, JOB_CREATED, etc.)
- `resource` — Filter by resource type
- `resourceId` — Filter by resource ID
- `limit` — Page size (max 200)
- `cursor` — Pagination cursor

## Cache Metrics

### GET /api/cache/metrics
Returns cache hit/miss statistics for the layered caching system.

## Deployment

### Environment Variables
All required env vars are documented in `.env.example`. The application validates critical configuration at startup via the `/api/ready` endpoint.

### Database Migrations
- `npm run db:push` — Push schema changes
- `npm run db:generate` — Regenerate Prisma client
- `npm run db:seed` — Seed initial data (plans, categories, cities)

### Monitoring
- **Sentry**: Captures all server-side errors and some client errors
- **PostHog**: Product analytics (page views, feature usage)
- **Clarity**: Session recordings and heatmaps
- **Web Vitals**: RUM performance data collected at `/api/vitals`
- **Health checks**: Configure your orchestrator to poll `/api/health` every 30s
