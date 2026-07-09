# Changelog — Workforce V3 RC1

## RC1 (2026-07-09)

### Security — Race Conditions
- **webhook idempotency race**: Moved payment status check inside atomic `updateMany` with `WHERE status = 'PENDING'` inside `$transaction` to prevent double credit on duplicate webhook delivery
- **verifyPayment race**: Same atomic `updateMany` pattern in client-side payment verification
- **postJob negative credits**: Replaced non-atomic check-then-decrement with interactive `$transaction` + atomic `updateMany` with `remaining >= 1` guard
- **applyToJob duplicate**: Added `@@unique([jobId, workerId])` constraint + Prisma P2002 catch to prevent race-condition duplicate applications

### Security — Authorization
- **updateJobStatus ADMIN restriction**: Added role-aware `where` clause — ADMIN can update any job, EMPLOYER can only update own jobs
- **employer registration city**: Added `city` to user update in `completeEmployerProfile`

### Infrastructure — Upload System
- **Cloudinary integration**: Added `cloudinary` package; upload now tries Cloudinary first with local filesystem fallback
- **MIME spoofing protection**: Strict `Set.has()` validation + Cloudinary `allowed_formats`
- **filesystem storage replaced**: Contact form moved from `fs/promises` to Prisma `ContactMessage` model

### Infrastructure — Redis
- **Graceful degradation**: All `redisSet`, `redisGet`, `redisDel`, `checkRateLimit` wrapped in try-catch with immediate in-memory store fallback

### Database
- **New model**: `ContactMessage` for persistent contact form storage
- **Unique constraint**: `@@unique([jobId, workerId])` on Application
- **Composite indexes** (10 new):
  - Job: `[employerId, status]`, `[employerId, createdAt]`, `[status, category, city]`, `[status, shiftType]`, `[status, city, salaryMin]`
  - Application: `[jobId, status]`, `[jobId, appliedAt]`
  - WorkerProfile: `[experienceYears]`, `[trade, isVerified]`
  - Category: `[name]`
  - City: `[name]`
  - Notification: `[userId, read]`, `[userId, createdAt]`
  - Payment: `[userId, createdAt]`, `[razorpayOrderId, status]`

### Performance
- **Overfetching fix**: Added `.select({ jobPostLimit, durationDays })` to Plan query in `completeEmployerProfile`
- **Overfetching fix**: Added `.select({ employerId })` to Job lookup in `getJobApplications`
- **Duplicate query elimination**: Removed redundant `application.count` from `getEmployerDashboard` (already provided by `getEmployerAnalytics`)

### Code Quality
- **Removed dead code**: `updatePhotoUrl`, `updateIdDocUrl` from `worker.actions.ts` (duplicated by upload.actions.ts)
- **Removed unused package**: `dotenv`
- **Removed unused import**: `bcrypt` from seed
- **Removed unused variable**: `ALLOWED_IMAGE_TYPES`
- **Fixed lint errors**: Replaced `any` casts with proper type assertions in seed
- **Zero lint warnings/errors**: ESLint clean

### Documentation
- **IMPLEMENTATION_REPORT.md**: All fixes, evidence, before/after
- **PERFORMANCE_REPORT.md**: Build metrics, query improvements, runtime times
- **SECURITY_REPORT.md**: Attack surface, race conditions, mitigations
- **DEPLOYMENT_REPORT.md**: Commands, logs, verified endpoints
- **RELEASE_CANDIDATE_REPORT.md**: Final acceptance gate status
- **KNOWN_LIMITATIONS.md**: Deferred items for future sprints
