# Dependency Audit Report

## Runtime Dependencies Cleanup

### Removed Packages (Phase 10)

| Package | Size Saved | Reason |
|---------|-----------|--------|
| `framer-motion` | ~10.4 MB | Unused (never imported) |
| `@radix-ui/react-dialog` | ~1 MB | Unused |
| `@radix-ui/react-tabs` | ~500 KB | Unused |
| `@radix-ui/react-toast` | ~500 KB | Unused |
| `@radix-ui/react-tooltip` | ~500 KB | Unused |

### Added Packages (Phase 10)
| Package | Reason |
|---------|--------|
| `@radix-ui/react-slot` | Direct dependency (was transitive) |

### Current Runtime Dependencies (22 packages)

| Package | Size | Purpose | Used |
|---------|------|---------|------|
| `next` | ~169 MB | Framework | ✅ |
| `react` / `react-dom` | ~7.4 MB | UI library | ✅ |
| `@prisma/client` + adapter | ~164 MB | Database ORM | ✅ |
| `lucide-react` | ~41 MB | Icons (tree-shakeable) | ✅ |
| `@sentry/nextjs` | ~80 MB | Error monitoring | ✅ |
| `posthog-js` / `posthog-node` | ~41 MB | Analytics | ✅ |
| `zod` | ~5 MB | Validation | ✅ |
| `razorpay` | ~460 KB | Payments | ✅ |
| `cloudinary` | ~448 KB | Image upload | ✅ |
| `@upstash/redis` | ~1.1 MB | Caching/rate limiting | ✅ |
| `jsonwebtoken` | ~360 KB | JWT auth | ✅ |
| `class-variance-authority` | ~44 KB | CSS variants | ✅ |
| `tailwind-merge` + `clsx` | ~1 MB | Utility | ✅ |
| `tailwindcss-animate` | ~100 KB | Animation utilities | ✅ |
| `@vercel/analytics` | ~100 KB | Analytics | ✅ |
| `@radix-ui/react-dropdown-menu` | ~1 MB | UI primitive | ✅ |
| `@radix-ui/react-select` | ~1 MB | UI primitive | ✅ |
| `@radix-ui/react-slot` | ~50 KB | UI primitive | ✅ |
| `pg` | ~500 KB | PostgreSQL driver | ✅ |

### Security Vulnerabilities
- **5 moderate** — all transitive, no high/critical
- Primary: `postcss` (via Next.js), `@hono/node-server` (via Prisma)
- No urgent action required

### Recommendations
- Monitor Prisma for patch addressing moderate CVE without major downgrade
- Consider `source-map-support` removal if not needed
- All packages are actively maintained

## Bundled Size: ~515 MB (node_modules)
Clean for a Next.js + Prisma + Sentry application.
