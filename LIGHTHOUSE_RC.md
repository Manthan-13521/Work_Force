# Lighthouse Release Candidate Report — Workforce RC

**Date:** 2026-07-09
**Target:** `http://localhost:3000`
**Tool:** Lighthouse 13.4.0 via Playwright's bundled Chromium
**Profile:** Desktop (1280x720, no throttling)
**Build:** Release Candidate (includes all Phase 2 fixes + PWA icons + SEO assets)

---

## Desktop Scores (Local RC)

| Metric | Value | Score | Target | Verdict |
|--------|-------|-------|--------|---------|
| **Performance** | — | **82%** | ≥95% | ⚠️ |
| **Accessibility** | — | **96%** | ≥95% | ✅ |
| **Best Practices** | — | **100%** | ≥95% | ✅ |
| **SEO** | — | **100%** | ≥95% | ✅ |
| First Contentful Paint | 255ms | 1.00 | ≤1s | ✅ |
| Largest Contentful Paint | 741ms | 0.98 | ≤2.5s | ✅ |
| **Cumulative Layout Shift** | **0.361** | **0.30** | <0.1 | ❌ |
| Total Blocking Time | 0ms | 1.00 | <200ms | ✅ |
| Speed Index | 814ms | 0.99 | ≤3s | ✅ |
| Time to Interactive | 741ms | 1.00 | | ✅ |
| Initial Server Response Time | 640ms | 0.00 | — | ⚠️ |

---

## Comparison: Phase 2 (Deployed Mobile) → RC (Local Desktop)

| Metric | Phase 2 (Mobile/Deployed) | Phase 3 RC (Desktop/Local) | Change |
|--------|--------------------------|---------------------------|--------|
| Performance | **75%** | **82%** | ↑ +7pp |
| Accessibility | **94%** | **96%** | ↑ +2pp ✅ |
| Best Practices | **96%** | **100%** | ↑ +4pp ✅ |
| SEO | **91%** | **100%** | ↑ +9pp ✅ |
| FCP | 947ms | **255ms** | ↓ -73% |
| LCP | 2.3s | **741ms** | ↓ -68% |
| CLS | **0.688** | **0.361** | ↓ -48% |
| TBT | 37ms | **0ms** | ↓ -100% |

**Note:** Phase 2 used mobile throttling (4x CPU, Fast 3G). RC uses desktop (no throttling). Direct comparison is directional.

---

## Issues Found

### Below-Threshold Issues

| Issue | Score | Severity |
|-------|-------|----------|
| Cumulative Layout Shift (0.361) | 0.30 | HIGH |
| Initial server response time (640ms) | 0.00 | MEDIUM |
| Render-blocking resources | 0.50 | MEDIUM |
| Legacy JavaScript (13 KiB savings) | 0.50 | LOW |

### Passed Audits

| Issue | Verdict |
|-------|---------|
| Color contrast | ✅ (was failing in Phase 2) |
| robots.txt | ✅ (was missing, now fixed) |
| sitemap.xml | ✅ (was missing, now fixed) |
| PWA icons | ✅ (was 404, now served) |
| Heading sequence | ✅ (was failing, now fixed) |
| No console errors | ✅ (was 1 error, now clean) |

---

## CLS Analysis

```
CLS Value: 0.361 (score: 0.30)
Layout shifts found: 1
```

The CLS is caused by late-loading page content pushing layout after initial paint. Likely suspects:
- Hero section images without explicit dimensions
- Dynamic content loading (notification badges, user state)
- Footer content shifting

**Remediation:**
1. Add `width`/`height` or `aspect-ratio` to all `<img>` and `<video>` elements
2. Reserve space for dynamic content using CSS `min-height` or skeleton states
3. Ensure footer does not shift when loading secondary content

---

## Diagnostics

| Issue | Impact | Estimated Savings |
|-------|--------|-------------------|
| Render-blocking resources | Delays paint | 100ms potential |
| Unused JavaScript (29 KiB) | Extra bytes parsed | — |
| Legacy JavaScript (13 KiB) | Transpilation overhead | — |

---

## Verdict

```
╔══════════════════════════════════════════════════╗
║        LIGHTHOUSE RC: CONDITIONAL PASS           ║
║        Scores: 82/96/100/100                     ║
║        CLS: 0.361 (needs fix)                    ║
║        TTFB: 640ms (dev server, not prod)        ║
╚══════════════════════════════════════════════════╝
```

**Improvements over Phase 2:**
- SEO: 100% ✅ (robots.txt + sitemap.xml + proper heading levels)
- Best Practices: 100% ✅ (no console errors, no 404s)
- Accessibility: 96% ✅ (passed threshold)
- CLS: 0.361 ↓ 47% from Phase 2's 0.688

**Remaining:**
- CLS still above 0.1 threshold — needs dimension reservations
- Server response time high (expected in dev mode)
