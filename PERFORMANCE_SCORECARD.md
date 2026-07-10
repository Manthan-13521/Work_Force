# Performance Scorecard

## Resource Budgets (from performance-budget.json)

| Route | JS Budget | CSS Budget | Image Budget | Response Time |
|-------|-----------|------------|-------------|---------------|
| Home | 300 KB | 100 KB | 200 KB | 2000ms |
| Jobs | 400 KB | 100 KB | 200 KB | 2500ms |
| Dashboard | 500 KB | 100 KB | 200 KB | 2500ms |
| Job Detail | 350 KB | 100 KB | 300 KB | 2000ms |

## Optimizations Applied

### Bundle
- Tree-shakeable icons (lucide-react via named imports)
- Package import optimization for 3 packages
- Removed 5 unused packages (framer-motion ~10.4MB, 4 unused Radix packages ~2.5MB)
- Server components by default; client components only where necessary
- `compiler.removeConsole` in production

### Images
- AVIF/WebP format support
- Cloudinary remote patterns configured
- `sizes="64px"` on profile avatar

### Caching
- 3-tier caching (React.cache → in-memory LRU → Redis)
- SWR stale-while-revalidate for dashboard data
- 17 data types with tailored TTLs
- Tag-based cache invalidation

### Real User Monitoring
- Web Vitals collected via `useReportWebVitals`
- Classification into good/needs-improvement/poor
- Sent to `/api/vitals` via `navigator.sendBeacon`

## Caching Performance

| Metric | Expected Value |
|--------|---------------|
| Cache hit ratio | >80% for public data |
| Cache hit ratio | >90% for static data (categories, cities) |
| Average response time (cached) | <50ms |
| Average response time (uncached) | <500ms |
| SWR background refresh | <1000ms |

## Web Vitals Targets

| Metric | Target |
|--------|--------|
| LCP | <2.5s |
| FID | <100ms |
| CLS | <0.1 |
| INP | <200ms |
| TTFB | <800ms |
