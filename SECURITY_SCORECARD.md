# Security Scorecard

## Overall Grade: **A-**

### Security Controls

| Control | Status | Details |
|---------|--------|---------|
| CSP | ✅ | strict policies, report-uri, report-to |
| HSTS | ✅ | max-age=63072000, includeSubDomains, preload |
| XSS Protection | ✅ | X-XSS-Protection, CSP |
| CSRF | ✅ | Origin validation in middleware |
| SQL Injection | ✅ | Prisma parameterized queries |
| Rate Limiting | ✅ | Per-phone (3/60s), per-IP, webhook |
| Auth Brute Force | ✅ | 5 attempts per 300s per phone |
| JWT | ✅ | HS256, configurable secret |
| OTP | ✅ | 6-digit, rate limited, consumed on use |
| Payment Verification | ✅ | HMAC-SHA256, amount validation |
| Webhook Verification | ✅ | HMAC-SHA256, replay protection |
| Secure Headers | ✅ | 12 security headers in middleware |
| CORS | ✅ | Origin validation for state-changing methods |
| Input Validation | ✅ | Zod schemas on all mutations |
| Audit Trail | ✅ | 25 event types for all mutations |
| Error Handling | ✅ | No stack traces in production |
| Session Management | ✅ | httpOnly cookies, JWT with expiry |

### Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| 5 moderate npm vulnerabilities | Low | All transitive; no high/critical |
| In-memory Redis fallback in dev | Low | Development only; production requires Redis |
| IP-based rate limiting uses X-Forwarded-For | Low | Trusted proxy configuration needed |
| No account deletion API | Low | Not yet implemented |
| No MFA support | Medium | Out of scope for current phase |

### Vulnerability Summary
- **0** critical
- **0** high
- **5** moderate (transitive, all non-exploitable in this context)
- **0** low
