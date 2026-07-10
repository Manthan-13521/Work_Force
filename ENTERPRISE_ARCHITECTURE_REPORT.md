# Enterprise Architecture Report

## Overview
Workforce is a Next.js 16.2.9 application using the App Router, Tailwind CSS v4 (OKLCH), Prisma (PostgreSQL), Upstash Redis, Razorpay payments, and enterprise observability tooling.

## Architecture Grade: **B+**

### Subsystem Grades

| Subsystem | Grade | Key Strengths | Key Weaknesses |
|-----------|-------|---------------|----------------|
| **Auth** | B+ | JWT + OTP flow, rate limiting, circuit breaker for SMS | Profile DB ops interleaved with auth domain |
| **Jobs** | B+ | Atomic credit decrement, cursor pagination | Pagination boilerplate duplicated |
| **Payments** | A- | Transactional credit upsert, webhook verification | Razorpay API retry added in Phase 10 |
| **Applications** | B+ | DB-level unique constraint for dedup | Was missing notification transaction (fixed Phase 10) |
| **Admin** | B | Comprehensive CRUD operations | Toggle race conditions fixed Phase 10 |
| **Analytics** | A | SWR caching, stale-while-revalidate, aggregate queries | None significant |
| **Components** | B | Clean ui/shared separation | Missing domain-specific dirs; dead components removed Phase 10 |
| **Lib** | B | Rich infrastructure (retry, timeout, circuit-breaker, cache) | Dead code removed Phase 10 |
| **Middleware** | B | Request ID tracing, CSP, security headers, role guard | No file-level middleware.ts (uses proxy.ts in src/) |

### Architecture Principles
1. **Server-first**: Pages are server components by default; `"use client"` only where hooks/browser APIs needed
2. **Domain-separated actions**: Each domain (auth, jobs, payments) has its own action file
3. **Infrastructure isolation**: Cross-cutting concerns live in `src/lib/` (cache, audit, logging, tracing)
4. **Fail-safe design**: Retry, timeout, circuit-breaker, and backoff for all external API calls
5. **Observability by default**: Every request gets a trace ID; every mutation is audited

### Key Architecture Decisions
- **Caching**: 3-tier (React.cache → in-memory LRU → Redis) with SWR background refresh
- **Payments**: Razorpay client-side order creation with server-side webhook verification
- **Auth**: Phone-based OTP with JWT sessions; rate-limited at per-phone and per-IP levels
- **Database**: Prisma with cursor-based pagination; composite indexes for common query patterns

## Bounded Contexts

```
┌─────────────┐
│   Auth      │  requestOTP, verifyLoginOTP, logout, profile completion
├─────────────┤
│   Jobs      │  postJob, search, update status, employer listings
├─────────────┤
│  Payments   │  Razorpay orders, verification, webhooks, plan credits
├─────────────┤
│Applications │  apply, shortlist, hire, reject, notifications
├─────────────┤
│   Admin     │  user management, verification, reports, categories
├─────────────┤
│  Analytics  │  dashboard stats, trends, insights, public stats
├─────────────┤
│   Cache     │  Tiered caching, TTL management, invalidation, metrics
├─────────────┤
│ Observability│Tracing, audit logging, metrics, health checks, alerting
└─────────────┘
```

## Technology Stack
- **Runtime**: Node.js (Next.js 16.2.9)
- **Database**: PostgreSQL via Prisma 7.8
- **Cache**: Upstash Redis
- **Payments**: Razorpay
- **Storage**: Cloudinary
- **Auth**: JWT + phone OTP (MSG91)
- **Monitoring**: Sentry, PostHog, Microsoft Clarity
- **Analytics**: Vercel Analytics
- **CI/Tests**: Vitest, Playwright
