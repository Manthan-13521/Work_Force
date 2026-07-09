# Changelog

## [0.1.0] — 2026-07-09

### Added
- Full platform implementation (Next.js 16 App Router + React 19)
- Worker, Employer, Admin role-based dashboards
- Phone + OTP authentication with JWT httpOnly cookies
- Job posting, browsing, filtering, and application pipeline
- Razorpay payment integration with plan-based job credits
- Admin panel: user management, job moderation, payment oversight, reports
- PWA support with service worker and manifest
- Rate limiting on OTP, logout, and report endpoints
- Structured logging with configurable logger
- Sentry error monitoring (client + server configuration)
- Playwright E2E test suite (public pages, auth flows, API health)
- 66 unit tests (pagination, schemas, utilities)
- Database audit report with index coverage analysis
- Security hardening:
  - CSRF protection with exact origin validation
  - Upload sanitization (MIME-based extension, crypto UUID)
  - CSP, security headers, XSS protection
  - Idempotent payment verification in transactions
  - Job view retention cleanup (90 days)

### Fixed
- Analytics per-job shortlisted/hired counts (was returning 0)
- Pagination negative-limit handling (falls back to PAGE_SIZE)
- Service worker registration via client component
- Metadata and SEO tags on root layout
- Cursor-based pagination tiebreaker ordering

### Security
- Origin validation uses exact `===` match (was vulnerable to subdomain bypass)
- Extract file extension from MIME type map, not user-provided filename
- Rate limiting on 3 API endpoints (OTP, logout, report)
- Suspended-user check in middleware

### Infrastructure
- Neon PostgreSQL database with Prisma adapter
- Upstash Redis with in-memory Map fallback
- Sentry DSN-ready (disabled by default)
- Playwright E2E with chromium
