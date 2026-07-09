# Release Notes — Workforce v0.1.0

## Overview
Workforce is a blue-collar industrial labour hiring platform connecting verified workers with employers in Hyderabad.

## What's New

### Core Features
- **Role-Based Platform**: Worker, Employer, and Admin dashboards with role-specific workflows
- **Phone + OTP Authentication**: JWT-based 7-day httpOnly cookie sessions
- **Job Management**: Post, browse, filter, and apply to industrial jobs
- **Application Pipeline**: Apply, shortlist, reject, hire workflow with real-time notifications
- **Premium Plans**: Razorpay-powered credit system for job posting limits
- **PWA Support**: Service worker with network-first strategy, offline-capable manifest
- **Admin Panel**: User management, job moderation, payment oversight, report handling

### Security
- **CSRF Protection**: Exact origin match + proper localhost hostname validation
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Rate Limiting**: IP-based rate limiting on OTP (send/verify), logout, and report endpoints
- **Input Validation**: Zod schemas on all server actions and API routes
- **Upload Sanitization**: MIME-based extension derivation, crypto UUID filenames
- **Idempotent Payments**: Transactional payment verification with race condition prevention

### Developer Experience
- **TypeScript Strict**: Full strict mode with no errors
- **Testing**: 66 Vitest tests across pagination, schemas, and utilities
- **E2E**: Playwright test suite for public pages, auth flows, and API health
- **CI-Ready**: Build, lint, and test all pass in under 10 seconds

## Deployment
- **Platform**: Vercel (Next.js 16.2.9)
- **Database**: Neon PostgreSQL with Prisma adapter
- **Cache/Rate Limiting**: Upstash Redis with in-memory Map fallback
- **Domain**: `https://work-force1-ivory.vercel.app`

## Known Limitations
1. SMS OTP requires MSG91 credentials — currently disabled
2. Razorpay payments require production API keys
3. Cloudinary uploads fall back to local filesystem
4. Sentry error monitoring requires DSN configuration
5. Full-text search uses ILIKE (not indexed) — add pg_trgm for scale
