# Known Limitations — Workforce V3 RC1

## Deferred Items (not bugs)

### 1. JWT Refresh / Rotation
- **Issue**: JWT tokens are issued with a 7-day expiry and no refresh mechanism.
- **Impact**: Users must re-authenticate after 7 days. No ability to revoke individual sessions server-side.
- **Priority**: Medium — acceptable for MVP scale.
- **Suggested fix**: Add `/api/auth/refresh` endpoint that issues a new JWT when the old one is within 24h of expiry. Store a refresh token hash in the database.

### 2. API-wide Rate Limiting
- **Issue**: Only OTP endpoints (`/api/otp/send`) have rate limiting. Other unauthenticated endpoints (`/api/health`, `/api/webhooks/razorpay`) are unrated.
- **Impact**: Health endpoint is harmless. Webhook is HMAC-protected. Low risk.
- **Priority**: Medium — add IP-based rate limiting to all API routes via middleware or a separate rate-limiting layer.
- **Suggested fix**: Add Upstash Redis rate limiting to the middleware with per-IP tracking for all `/api/*` routes.

### 3. Integration / E2E Test Coverage
- **Issue**: 26 unit tests cover pagination, schemas, and utility functions only. No integration tests for auth flows, payment flows, OTP, upload, or multi-step workflows.
- **Impact**: Manual regression testing required for each deploy.
- **Priority**: Low — acceptable for RC1. Add Playwright or Vitest integration tests in RC2.
- **Suggested fix**: Add 10-15 integration tests covering worker registration → OTP → login → job apply → employer verification → payment → hire flow.

### 4. Cloudinary Production Configuration
- **Issue**: Cloudinary upload is implemented but requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` environment variables to be set in production.
- **Impact**: Falls back to local filesystem upload (works in dev but not on Vercel).
- **Priority**: High for production deployment — must be configured before going live.

### 5. MSG91 SMS Production Configuration
- **Issue**: SMS OTP delivery requires `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, and `MSG91_TEMPLATE_ID` env vars. In development, OTP is auto-accepted.
- **Impact**: Without configuration, OTP verification will not send real SMS in production. Users can still authenticate in dev mode.
- **Priority**: High for production deployment — must be configured before going live.

### 6. No Database Connection Pool Tuning
- **Issue**: Prisma uses the default connection pool from `@prisma/adapter-pg`. No custom pool configuration.
- **Impact**: May be insufficient under high concurrent load (1000+ simultaneous users).
- **Priority**: Low — monitor in production and add `connection_limit` to connection string if needed.

### 7. No Structured Error Tracking
- **Issue**: Errors are logged via `console.error` with JSON. No Sentry, DataDog, or similar integration.
- **Impact**: Debugging production issues requires log access.
- **Priority**: Low — defer to ops layer.

### 8. No Database Migration History
- **Issue**: Using `prisma db push` instead of `prisma migrate dev` — no migration history tracked.
- **Impact**: Safe for dev/early production. Switch to migrations for team environments.
- **Priority**: Low — switch to `prisma migrate` before adding additional team members.
