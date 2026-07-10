# Reliability Report

## Critical Workflow Audit Results

### Payment Flow
| Property | Status | Fix Applied |
|----------|--------|-------------|
| Retry safety | ✅ | `retry()` + `withTimeout()` on Razorpay API call |
| Idempotency | ✅ | Check for existing PENDING payment before creating order |
| Failure recovery | ✅ | Compensation step for orphaned Razorpay orders |
| Transaction rollback | ✅ | Prisma $transaction for payment + credit update |
| Duplicate prevention | ✅ | updateMany with status:PENDING guard |
| Signature verification | ✅ | HMAC-SHA256 + constant-time comparison |
| Replay protection | ✅ | Webhook event_id dedup via Redis |

### Webhook Flow
| Property | Status | Fix Applied |
|----------|--------|-------------|
| Signature verification | ✅ | Dedicated RAZORPAY_WEBHOOK_SECRET (no fallback) |
| Replay protection | ✅ | event_id stored in Redis with 1h TTL |
| Idempotency | ✅ | updateMany with status guard |
| Amount validation | ✅ | Paid amount vs expected amount check |
| Rate limiting | ✅ | 10 req/60s per IP |
| Audit logging | ✅ | recordAuditEvent for captured and failed events |

### Job Posting Flow
| Property | Status | Fix Applied |
|----------|--------|-------------|
| Credit decrement race safety | ✅ | Atomic updateMany with remaining >= 1 |
| Transaction atomicity | ✅ | $transaction wrapping credit + job creation |
| Expiry validation | ✅ | Check expiryDate before decrement |
| Admin bypass | ✅ | Admins skip credit check |
| Audit ordering | ✅ | recordAuditEvent before redirect |

### Application Flow
| Property | Status | Fix Applied |
|----------|--------|-------------|
| Duplicate prevention | ✅ | DB unique(jobId, workerId) constraint ✅ |
| Notification atomicity | ✅ | $transaction wrapping application + notification |
| Authorization | ✅ | Employer ownership check on status update |
| Notifications | ✅ | Contextual notifications (SHORTLISTED/HIRED/REJECTED) |

### Auth Flow
| Property | Status | Fix Applied |
|----------|--------|-------------|
| OTP rate limiting | ✅ | 3 req/60s per phone |
| Verify rate limiting | ✅ | 5 attempts/300s per phone |
| OTP replay prevention | ✅ | Atomic read+delete on verification |
| Constant-time comparison | ✅ | constantTimeEqual utility |
| SMS resilience | ✅ | Retry(3) + timeout(5s) + circuit breaker |
| JWT signing | ✅ | HS256 with configurable secret |
| Session management | ✅ | httpOnly cookies |

### Admin Flow
| Property | Status | Fix Applied |
|----------|--------|-------------|
| Toggle race conditions | ✅ | Atomic updateMany with conditional where (Phase 10) |
| Verify idempotency | ✅ | updateMany with isVerified: { not: true } (Phase 10) |
| Audit logging | ✅ | All admin actions audited |
| Input validation | ✅ | Zod schemas on all admin mutations |

## Overall Reliability Grade: **A**
