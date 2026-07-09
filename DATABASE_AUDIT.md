# Database Audit Report

## Overview
- **Database**: PostgreSQL 16 (Neon)
- **Adapter**: `@prisma/adapter-pg`
- **Migrations**: Prisma `db push` (schema-first)
- **Models**: 13
- **Enums**: 11
- **Indexes**: 35+

## Schema Health

### Index Coverage

| Model | Composite Indexes | High-Frequency Queries Covered |
|-------|------------------|-------------------------------|
| User | role, status, city | ✅ Yes — `findUnique` by id (PK), search by name/phone (OR) partially covered |
| WorkerProfile | trade, isVerified, trade+isVerified, experienceYears | ✅ Yes — `findMany` by isVerified, sort by experienceYears |
| EmployerProfile | isVerified, industry | ✅ Yes — `count` by isVerified |
| Job | employerId, status, category, city, shiftType, isFeatured, expiresAt, createdAt, employerId+status, employerId+createdAt, status+category+city, status+shiftType, status+city+salaryMin | ✅ Excellent coverage |
| Application | jobId, workerId, status, appliedAt, jobId+status, jobId+appliedAt, UNIQUE(jobId,workerId) | ✅ Excellent coverage |
| Payment | userId, razorpayOrderId, status, createdAt, userId+createdAt, razorpayOrderId+status | ✅ Excellent coverage |
| Report | targetType, targetId, status, createdAt | ✅ Good coverage |
| Notification | userId, userId+read, userId+createdAt | ✅ Excellent coverage |
| JobView | jobId, viewedAt, jobId+viewedAt | ✅ Good coverage |

### Missing Indexes

1. **User.name** — `pg_trgm` GIN index needed for `contains` search in admin user listing
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_name_trgm ON "User" USING GIN (name gin_trgm_ops);
   ```

2. **Job.description** — `pg_trgm` GIN index for job search
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_description_trgm ON "Job" USING GIN (description gin_trgm_ops);
   ```

## Query Analysis

### Pagination Pattern
- **Cursor-based**: All `findMany` calls use cursor-based pagination with `take`, `cursor`, `skip`
- **Ordering**: Always a tiebreaker on `id` to prevent cursor ambiguity
- ✅ Optimal pattern for large datasets

### Transaction Usage
- **Job posting**: `$transaction` with credit check → decrement → create
- **Payment verification**: `$transaction` with idempotent `updateMany`
- ✅ Race conditions prevented

### Full-Text Search
- **Current**: `contains` with `mode: "insensitive"` (PostgreSQL ILIKE)
- **Recommendation**: Install `pg_trgm` extension and add GIN indexes on `Job.title`, `Job.description`, `User.name`
- **For production scale**: Consider moving to full-text search with `tsvector` columns

## Connection Pooling

### Current Setup
- **Adapter**: `@prisma/adapter-pg` with direct `pg` connection
- **Pool configuration**: Not explicitly configured (uses default pool size)

### Recommendations
1. **Neon**: Use `neon` serverless driver for serverless environments
2. **Explicit pool**: Set `connectionLimit` via `pg` pool config
3. **PGAggregate**: Consider connection pooling via PgBouncer in transaction mode

## Migration Strategy

### Current Approach: `prisma db push`
- ✅ Fast for development
- ⚠️ Not suitable for production — `prisma migrate` recommended
- ✅ Schema is declarative and well-structured

### Recommended
1. Run `prisma migrate dev --name init` to create initial migration
2. Use `prisma migrate deploy` in CI/CD
3. Generate migration for `pg_trgm` extension separately

## Performance Metrics (Estimated)

| Query | Estimated Rows | Index Used | Performance |
|-------|---------------|------------|-------------|
| Public job listing | All ACTIVE jobs | status+createdat | ✅ Fast |
| Employer jobs | Per employer | employerid+status | ✅ Fast |
| Worker applications | Per worker | workerid+appliedat | ✅ Fast |
| Job search with filter | Filtered subset | status+category+city | ✅ Fast |
| Admin user search | All users | seq scan on name | ⚠️ Degrades with scale |

## Recommendations Summary

1. **High Priority**: Add `pg_trgm` GIN indexes on `User.name`, `Job.title`, `Job.description`
2. **Medium Priority**: Migrate from `db push` to `prisma migrate`
3. **Medium Priority**: Configure connection pooling for production
4. **Low Priority**: Add database-level audit triggers for sensitive tables
5. **Low Priority**: Set up automated `ANALYZE` scheduling
