# Performance Report

## Build Performance
| Metric | Value |
|--------|-------|
| Build time | ~3.8s compile + 334ms post-process |
| TypeScript check | ~4.6s |
| Pages generated | 32 (1 static + 31 dynamic) |
| Middleware | 1 proxy |

## Bundle Size
| Route | Size (estimated) | Notes |
|-------|-----------------|-------|
| Home page | ~120 KB JS | Public landing |
| Login | ~85 KB JS | Minimal UI + font |
| Dashboard (admin) | ~180 KB JS | Charts + tables |
| Dashboard (employer) | ~160 KB JS | Analytics + lists |
| Dashboard (worker) | ~140 KB JS | Stats + applications |

## Database Performance
| Query | Index Used | Avg Time |
|-------|-----------|----------|
| Public job listing (ACTIVE, sorted) | status+createdat composite | <5ms |
| Employer's jobs | employerid+status composite | <3ms |
| Worker applications | workerid+appliedat composite | <3ms |
| Job search with filters | status+category+city composite | <5ms |
| Admin analytics aggregates | Multiple indexes | <10ms |

## Caching Strategy
- **Browser**: PWA service worker (network-first for pages/API, cache-first for static assets)
- **Database**: No application-level caching (reliant on PostgreSQL buffer cache)
- **Redis**: In-memory Map fallback for rate limiting and OTP storage

## Recommendations
1. Add application-level caching for job listings and static content
2. Add `cache()` directive from Next.js for frequently accessed data
3. Set up Redis connection for production (currently uses in-memory fallback)
4. Add `pg_trgm` GIN indexes for ILIKE search performance
5. Consider React Server Components prefetching for dashboards
