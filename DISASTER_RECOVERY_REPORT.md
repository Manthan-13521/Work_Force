# Disaster Recovery Report

## Backup Strategy

### Database
- **PostgreSQL automated backups** (via hosting provider)
- **Prisma migrations** version-controlled in git
- **Seed script** (`prisma/seed.ts`) for baseline data recovery

### Redis
- Data is ephemeral (caching, rate limiting, OTPs)
- OTPs expire after 5 minutes
- Cache can be rebuilt from DB on restart

### File Storage
- Images stored in Cloudinary (provider-managed durability)
- No local file storage

## Recovery Procedures

### Database Recovery
1. Restore from latest backup
2. Run `npx prisma db push` to ensure schema alignment
3. Run `npm run db:seed` to seed reference data (plans, categories, cities)
4. Verify via `/api/health` and `/api/ready`

### Full Application Recovery
1. Clone repository
2. Copy `.env` with production secrets
3. Run `npm ci`
4. Run `npm run build`
5. Start with `npm start`
6. Verify health endpoints

## RPO and RTO Targets

| Component | RPO | RTO |
|-----------|-----|-----|
| Database | 5 minutes (streaming replication) | 15 minutes |
| Application | N/A (stateless) | 5 minutes |
| Redis | 0 (ephemeral) | <1 minute |
| File Storage | Provider-managed | Provider-managed |

## Integrity Validation
- Database health check in `/api/health` confirms connectivity
- Prisma schema validated at build time
- Environment variable validation at startup
- Webhook replay protection via event_id dedup
