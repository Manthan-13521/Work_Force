# Architecture Audit Report — Workforce RC

**Date:** 2026-07-09
**Scope:** `src/` directory

---

## 1. Folder Structure

```
src/
  actions/         — 11 server action files (*.actions.ts)
  app/             — Next.js App Router (33 routes)
    (auth)/        — login, register
    (public)/      — home, jobs, about, contact, pricing, workers
    admin/         — dashboard, users, jobs, payments, reports, categories, approvals
    api/           — health, live, ready, logout, otp/send, webhooks/razorpay
    employer/      — dashboard, jobs, payments, profile
    worker/        — dashboard, applications, profile
  components/
    layout/        — footer.tsx, navbar.tsx
    shared/        — 8 shared components (badge, pagination, loading states, etc.)
    ui/            — 4 base UI components (button, card, input, textarea)
  generated/
    prisma/        — Auto-generated Prisma client (models/, client.ts, enums.ts)
  lib/             — 14 utility modules + 8 test files
  env.ts           — Zod env validation
  instrumentation.ts — Next.js instrumentation
  proxy.ts         — Middleware (should be middleware.ts)
```

**Conforms to Next.js App Router conventions** ✅

---

## 2. Component Architecture

**14 components** across 3 subdirectories. No component exceeds 300 lines (largest: `navbar.tsx` at 161 lines).

**Server vs Client Components:**
| Type | Count |
|------|-------|
| Client (`"use client"`) | 26 |
| Server (default) | ~27 |
| Server Actions (`"use server"`) | 11 |

Good separation of concerns — client components only where interactivity is needed.

---

## 3. API Routes

**6 API route files** with consistent patterns but lacking a unified error handler.

| Route | Rate Limited | Error Format |
|-------|-------------|--------------|
| `GET /api/health` | No | Complex status object |
| `GET /api/live` | No | `{ alive: true }` |
| `GET /api/ready` | No | `{ ok: true }` |
| `POST /api/otp/send` | Yes | `{ error: string }` or `{ success: true }` |
| `POST /api/logout` | Yes | `{ error: string }` |
| `POST /api/webhooks/razorpay` | Yes | `{ error: string }` or `{ received: true }` |

**Recommendation:** Create a shared `apiResponse()` helper for consistent error/success shapes.

---

## 4. Code Duplication Areas

| Area | Files Affected | Lines Duplicated | Severity |
|------|---------------|------------------|----------|
| Auth guard + notification check | 3 layout files | ~40 lines each | MEDIUM |
| Pagination boilerplate | 7 action files | ~6 lines each | LOW |
| Payment idempotency logic | 2 files | ~20 lines | MEDIUM |
| Error boundary components | 5 files | ~13 lines each | LOW |

**Recommendation:**
- Extract auth guard into a shared `withAuth` wrapper
- Create a `paginate()` helper function
- Share payment processing logic via a utility function

---

## 5. File Sizes

**No files exceed 500 lines.** Top 5 largest hand-written files:

| File | Lines | Notes |
|------|-------|-------|
| `src/lib/schemas.test.ts` | 350 | Test file |
| `src/app/(auth)/register/page.tsx` | 315 | Registration page |
| `src/actions/admin.actions.ts` | 249 | 18 exported functions |
| `src/app/employer/dashboard/page.tsx` | 229 | Dashboard with analytics |
| `src/app/employer/jobs/new/page.tsx` | 214 | Job posting form |

All under 500-line threshold. No refactoring needed for size.

---

## 6. Testing Coverage

**14 test files** (8 unit + 6 E2E), ~239 assertions.

| Area | Covered | Notes |
|------|---------|-------|
| Auth (JWT, OTP) | ✅ Unit + E2E | |
| Pagination logic | ✅ Unit | |
| Schema validation | ✅ Unit | 16 Zod schemas tested |
| API endpoints | ✅ E2E | |
| Security headers | ✅ E2E | |
| Protected routes | ✅ E2E | |
| Server actions | ❌ Not tested | No DB mocking |
| UI components | ❌ Not tested | Only E2E DOM checks |
| Rate limiting | ❌ Not tested | |
| Payment flows | ❌ Not tested | |
| Middleware | ❌ Not tested | |

**Recommendation:** Add server action tests using `vitest` + mocking.

---

## 7. Naming Conventions

| Convention | Status |
|------------|--------|
| Components: PascalCase | ✅ Consistent |
| Utilities: camelCase | ✅ Consistent |
| Action files: `*.actions.ts` | ✅ Consistent |
| Lib files: kebab-case | ✅ Consistent |
| API routes: `route.ts` | ✅ Standard |
| Page routes: `page.tsx` | ✅ Standard |
| Middleware: `proxy.ts` | ⚠️ Should be `middleware.ts` |

---

## Verdict

```
╔══════════════════════════════════════════════════╗
║        ARCHITECTURE AUDIT: PASS (A-)             ║
║        Clean structure · Good conventions        ║
║        3 duplication areas · 1 naming deviation  ║
╚══════════════════════════════════════════════════╝
```
