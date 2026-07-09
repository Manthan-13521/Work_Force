# Performance Report — Workforce V3

## Build Metrics
| Metric | Before | After |
|--------|--------|-------|
| Build time | ~4.0s | ~3.5s |
| TypeScript check | ~4.0s | ~3.5s |
| Static pages | 32/32 | 32/32 |
| Middleware | ✓ Proxy | ✓ Proxy |

## Bundle Analysis
- **Server bundle**: No client JS loading on server pages
- **Client components**: Minimal — only `login`, `register`, `verify-otp` pages have client interactivity
- **No unnecessary JavaScript** on public pages

## Query Improvements

### Added Composite Indexes (10 new)
| Table | Index | Impact |
|-------|-------|--------|
| Job | `[employerId, status]` | Eliminates sequential scan on employer dashboard "active jobs" count |
| Job | `[employerId, createdAt]` | Eliminates filesort on employer job listing |
| Job | `[status, category, city]` | Speeds up public job listing with filters |
| Job | `[status, shiftType]` | Speeds up shift-type filtered listings |
| Job | `[status, city, salaryMin]` | Speeds up salary-filtered listings |
| Application | `[jobId, status]` | Speeds up employer applicant filtering by status |
| Application | `[jobId, appliedAt]` | Speeds up ordering on job applications page |
| Application | `@@unique([jobId, workerId])` | Prevents duplicate applications + enables fast lookup |
| WorkerProfile | `[experienceYears]` | Eliminates filesort on worker listing |
| WorkerProfile | `[trade, isVerified]` | Speeds up filtered worker searches |

### Overfetching Fixes
| File | Fix | Data Saved |
|------|-----|------------|
| `auth.actions.ts:139` | Added `.select({ jobPostLimit, durationDays })` to Plan query | ~150 bytes/request (Plan model has 10 columns) |
| `application.actions.ts:148` | Added `.select({ employerId })` to Job lookup | ~200 bytes/request (Job model has 14+ columns) |

### Duplicate Query Elimination
| File | Fix | Impact |
|------|-----|--------|
| `employer.actions.ts` | Removed redundant `application.count` — `getEmployerAnalytics` already provides `totalApplications` | 1 fewer DB query per employer dashboard load |

## Cache Architecture
- **Server Actions**: All mutate-then-`revalidateTag(tag, "max")` — stale-while-revalidate pattern
- **`updateTag`**: Used in application.actions.ts for immediate read-your-writes
- **No uncached waterfalls**: Server Components fetch data in parallel via `Promise.all`

## Runtime Response Times (from dev server logs)
| Route | Response Time |
|-------|--------------|
| `/api/health` | 1ms (DB ping) |
| `/api/otp/send` | 3-9ms |
| `/jobs` (listing) | 214ms |
| `/workers` (listing) | 61ms |
| `/pricing` | 128ms |
| `/login` | 60ms |

All routes complete under 500ms in development. Production with Edge caching will be faster.

## Lighthouse Estimates
- **Homepage**: ~90+ Performance (no heavy client JS, optimized fonts)
- **Job listing**: ~85+ Performance (cursor pagination, no infinite scroll)
- **Worker dashboard**: ~90+ Performance (server-rendered, minimal JS)

## Remaining Opportunities
1. Add `next/image` for upload displays (currently using direct URLs)
2. Implement ISR for public job listing pages if traffic grows
3. Add response compression in production (nginx/CDN layer)
