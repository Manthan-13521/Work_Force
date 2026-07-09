# Static Code Audit Report — Workforce RC

**Date:** 2026-07-09
**Repository:** `/Users/manthanjaiswal/PROJECTS/Other SAAS/Work_force/workforce`
**Branch:** `main`
**Audit Scope:** `src/` and `app/` directories (excludes `node_modules/`, `.next/`, `e2e/`, `k6/`, `scripts/`, test files)

---

## Summary

| Category | Findings | Severity |
|----------|----------|----------|
| TODOs / FIXMEs / HACKs | 0 | — |
| console.log in server code | 6 (all intentional) | LOW |
| process.argv usage | 0 | — |
| fs / path in production code | 2 (upload.actions.ts) | MEDIUM |
| Edge Runtime incompatibilities | 4 files | MEDIUM |
| Middleware registration | Not wired up | HIGH |
| Circular imports | 0 | — |
| Near-empty files | 9 (all valid) | INFO |
| Unused dependencies | 12 packages | MEDIUM |
| Dead routes | 0 | — |
| `updateTag` API mismatch | 0 (confirmed correct) | — |

**Overall: 1 HIGH, 5 MEDIUM, 2 LOW issues found. No CRITICAL issues.**

---

## 1. TODOs / FIXMEs / HACKs / XXX / WORKAROUND

**Result: 0 findings.** No technical debt markers found in production source code.

---

## 2. console.log / console.debug / console.warn in Server Code

**Result: 6 occurrences — all INTENTIONAL, not debug leftovers.**

| # | File | Line | Content | Assessment |
|---|------|------|---------|------------|
| 1 | `src/env.ts` | 60 | `console.error(\`  - \${issue.path.join(".")}: \${issue.message}\`);` | Startup validation — acceptable |
| 2 | `src/env.ts` | 65 | `console.warn("⚠ Running with missing or invalid env vars");` | Startup warning — acceptable |
| 3 | `src/instrumentation.ts` | 8 | `console.log(\`Starting in production mode...\`);` | Startup log — acceptable |
| 4 | `src/instrumentation.ts` | 9 | `console.log(\`Features:...\`);` | Startup log — acceptable |
| 5 | `src/lib/logger.ts` | 67 | `console.warn(output);` | Part of structured logger — acceptable |
| 6 | `src/lib/logger.ts` | 71 | `console.log(output);` | Part of structured logger — acceptable |

**Verdict: PASS — No debug/stray console.log in production code paths.**

---

## 3. process.argv Usage

**Result: 0 occurrences.** Previously fixed in `src/env.ts`. Clean.

---

## 4. fs / path Usage in Production Code

**Result: 2 files use Node.js filesystem APIs.**

| # | File | Line | Import | Risk |
|---|------|------|--------|------|
| 1 | `src/actions/upload.actions.ts` | 6 | `import { writeFile, mkdir } from "fs/promises"` | Will fail in Edge Runtime |
| 2 | `src/actions/upload.actions.ts` | 7 | `import path from "path"` | Will fail in Edge Runtime |

**Context:** These are used as a last-resort fallback when Cloudinary upload fails (lines 83-85). Cloudinary is tried first (lines 53-77). This is a `"use server"` action that runs on the Node.js server, not Edge.

**Verdict: ACCEPTABLE for Node.js deployment.** Would fail in Edge Runtime but the route is not configured as Edge.

---

## 5. Edge Runtime Incompatible APIs

**Result: 4 files have APIs incompatible with Edge Runtime.**

| # | File | Line | API | Compat? |
|---|------|------|-----|---------|
| 1 | `src/app/api/health/route.ts` | 7-9 | `process.version`, `process.memoryUsage()` | Node.js only |
| 2 | `src/actions/upload.actions.ts` | 6-7 | `fs/promises`, `path` | Node.js only |
| 3 | `src/app/api/webhooks/razorpay/route.ts` | 4 | `import crypto from "crypto"` (Node.js) | Node.js only |
| 4 | `src/actions/payment.actions.ts` | 7 | `import crypto from "crypto"` (Node.js) | Node.js only |

**Context:** None of these files set `runtime: 'edge'`. They all default to Node.js runtime. Only a problem if someone adds `export const runtime = 'edge'`.

**Verdict: ACCEPTABLE for current deployment (Node.js runtime).**

---

## 6. Middleware Registration

**Result: HIGH — Proxy logic is NOT wired up.**

| File | Purpose | Status |
|------|---------|--------|
| `src/proxy.ts` | Auth, CSRF, security headers, redirect logic | **Defined but not registered** |
| `src/middleware.ts` | Next.js Middleware entry point | **Does not exist** |

**Impact:**
- All security headers defined in `proxy.ts` (CSP, HSTS, etc.) are **not being applied**
- CSRF protection logic in `proxy.ts` is **inactive**
- Auth redirect logic in `proxy.ts` is **inactive**

**Remediation:** Create `src/middleware.ts` that imports and uses `proxy.ts` handlers. This is the highest priority issue.

---

## 7. Circular Imports

**Result: 0 circular dependency chains found.** Import graph forms a DAG.

---

## 8. Near-Empty Files (< 10 lines of executable code)

**Result: 9 files — all are standard boilerplate.**

| # | File | Lines | Content |
|---|------|-------|---------|
| 1 | `src/app/(auth)/loading.tsx` | 5 | `<LoadingState message="Loading..." />` |
| 2 | `src/app/worker/loading.tsx` | 5 | `<LoadingState message="Loading your dashboard..." />` |
| 3 | `src/app/(public)/loading.tsx` | 5 | `<LoadingState message="Loading..." />` |
| 4 | `src/app/admin/loading.tsx` | 5 | `<LoadingState message="Loading admin panel..." />` |
| 5 | `src/app/employer/loading.tsx` | 5 | `<LoadingState message="Loading your dashboard..." />` |
| 6 | `src/lib/sentry.ts` | 9 | Helper functions |
| 7 | `src/app/(auth)/layout.tsx` | 7 | Simple centered layout |
| 8 | `src/app/sitemap.ts` | 29 | Valid sitemap generator |
| 9 | `src/lib/timeout.ts` | 12 | Utility function |

**Verdict: INFO — All are expected by Next.js conventions or are valid utilities.**

---

## 9. Unused Dependencies

**Result: 12 packages imported but not used in any source file.**

| # | Package | Size (approx) | Notes |
|---|---------|---------------|-------|
| 1 | `@radix-ui/react-avatar` | 15 KB | Not imported anywhere |
| 2 | `@radix-ui/react-checkbox` | 12 KB | Not imported anywhere |
| 3 | `@radix-ui/react-dialog` | 20 KB | Not imported anywhere |
| 4 | `@radix-ui/react-dropdown-menu` | 25 KB | Not imported anywhere |
| 5 | `@radix-ui/react-label` | 8 KB | Not imported anywhere |
| 6 | `@radix-ui/react-radio-group` | 18 KB | Not imported anywhere |
| 7 | `@radix-ui/react-select` | 30 KB | Not imported anywhere |
| 8 | `@radix-ui/react-separator` | 8 KB | Not imported anywhere |
| 9 | `@radix-ui/react-switch` | 10 KB | Not imported anywhere |
| 10 | `@radix-ui/react-tabs` | 15 KB | Not imported anywhere |
| 11 | `@radix-ui/react-toast` | 20 KB | Not imported anywhere |
| 12 | `tailwindcss-animate` | 5 KB | Plugin not imported |

**Total bloat:** ~186 KB in unused packages.

**Verdict: MEDIUM — Should be removed via `npm uninstall` to reduce bundle and dependency surface.**

---

## 10. Dead Routes

**Result: 0 dead routes found.**

All 33 route files in `app/` are either:
- Actively linked from navigation/layouts
- Referenced in redirect/auth logic
- Implicitly consumed by Next.js (`robots.ts`, `sitemap.ts`, `not-found.tsx`, `global-error.tsx`, `layout.tsx`, `loading.tsx`)

---

## 11. `updateTag` API Correctness

**Result: CONFIRMED CORRECT.**

`src/actions/application.actions.ts` uses `updateTag` from `next/cache`:

```ts
import { updateTag } from "next/cache";  // Line 5
updateTag("applications");                // Lines 42, 113
```

In Next.js 16.2.9:
- `updateTag(tag)` — Server Action only, 1 arg, immediate expiration ✅
- `revalidateTag(tag, profile)` — Any context, requires 2nd arg

The code is correct for this Next.js version.

---

## Audit Verdict

```
╔════════════════════════════════════════════════════╗
║           STATIC CODE AUDIT: CONDITIONAL PASS       ║
╚════════════════════════════════════════════════════╝

CRITICAL: 0  |  HIGH: 1  |  MEDIUM: 5  |  LOW: 2  |  INFO: 2
```

### Must Fix Before GA
1. **HIGH — Middleware not wired up:** Create `src/middleware.ts` that imports `proxy.ts`

### Should Fix Before GA
2. **MEDIUM — Remove 12 unused dependencies:** `npm uninstall @radix-ui/react-avatar ...`
