# Security Report — Workforce V3

## Attack Surface & Testing Results

### Race Conditions (4 found and fixed)
| Vulnerability | Vector | Impact | Fix |
|--------------|--------|--------|-----|
| Webhook double credit | Duplicate Razorpay webhook delivery | Free job credits | Atomic `updateMany` with `status: "PENDING"` inside transaction |
| Payment double credit | Rapid client-side `verifyPayment` calls | Free job credits | Same atomic pattern as webhook |
| Negative job credits | Two parallel `postJob` calls | Jobs posted without paying | Interactive transaction + atomic `updateMany` with `remaining: { gte: 1 }` |
| Duplicate applications | Two parallel `applyToJob` calls | Spam applications | `@@unique([jobId, workerId])` constraint + Prisma P2002 catch |

### Authorization (2 issues fixed)
| Issue | Vector | Fix |
|-------|--------|-----|
| ADMIN can't updateJobStatus | ADMIN role blocked by `employerId: user.id` filter | Role-aware where clause |
| Employer registration ignores city | `completeEmployerProfile` didn't save city | Added `city: parsed.data.city` to user update |

### CSRF
- **Public/whitelist endpoints**: CSRF check skipped intentionally (OTP, health, webhooks)
- **Authenticated endpoints**: Origin/referer validation via middleware
- **Risk**: Low — OTP endpoints are rate-limited; authenticated routes have origin check

### XSS
- CSP headers set: `default-src 'self'; script-src 'self' 'unsafe-inline'`
- All user content rendered via Server Components (no dangerouslySetInnerHTML)
- No raw HTML rendering in any component

### Upload Security
| Check | Status |
|-------|--------|
| MIME validation | ✓ Server-side check against strict allowlist |
| File size limit | ✓ 5MB max enforced before any processing |
| File extension from MIME | ✓ Cloudinary `allowed_formats` parameter |
| Path traversal | ✓ Cloudinary handles storage; local fallback uses sanitized path |
| MIME spoofing | ✓ Enhanced: uses `Set.has()` lookup, Cloudinary validates on its end |

### Rate Limiting
| Endpoint | Limit | Status |
|----------|-------|--------|
| OTP send | 3/60s per phone + 10/60s per IP | ✓ Verified working (returns 429) |
| OTP verify | 5/300s per phone | ✓ Implemented |

### Authentication
| Check | Status |
|-------|--------|
| JWT token in httpOnly cookie | ✓ |
| JWT expiry (7 days) | ✓ |
| Suspended user rejection | ✓ at auth layer |
| Token verification in middleware | ✓ |
| Role enforcement in middleware | ✓ |
| Role enforcement in server actions | ✓ via `requireAuth([roles])` |

### Access Control
- **IDOR testing**: `getJobApplications` checks `job.employerId !== user.id` before returning data
- **UpdateApplicationStatus**: Checks `application.job.employerId !== user.id`
- **Admin actions**: All gated by `requireAuth(["ADMIN"])`

### OTP Security (Development Mode)
- In development, OTP is auto-accepted (simulated SMS)
- In production, MSG91 integration sends real SMS — implement after API keys configured
- OTP stored in Redis with 600s TTL, single-use (deleted after verification)

### Dependency Vulnerabilities
- 5 moderate severity vulnerabilities from `npm audit`
- Risk: Low — all are dev dependencies or transitive

## Remaining Medium Risks
1. **No JWT refresh/rotation** — tokens valid for 7 days with no rotation
2. **No API-wide rate limiting** — only OTP endpoints are rate-limited
3. **Webhook secret stored in env** — acceptable for production with proper secret management
