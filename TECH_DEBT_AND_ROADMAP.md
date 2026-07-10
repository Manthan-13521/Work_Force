# Technical Debt & Roadmap for v2

## Remaining Technical Debt

### Low Priority (v2.1)
| Item | Location | Effort | Impact |
|------|----------|--------|--------|
| DRY pagination boilerplate | 10+ action files | 2 days | Code consistency |
| Create notification helper | application.actions.ts | 1 hour | Remove 4x duplicated notification pattern |
| Consolidate cache imports | employer.actions.ts | 30 min | Consistency |
| Standardize `src/proxy.ts` → `middleware.ts` | Root | 30 min | Convention compliance |

### Medium Priority (v2.2)
| Item | Location | Effort | Impact |
|------|----------|--------|--------|
| Extract profile DB ops from auth domain | auth.actions.ts | 1 day | Domain purity |
| Add account deletion API | New | 2 days | Compliance/GDPR |
| Implement notification outbox pattern | application.actions.ts | 2 days | Reliability |
| Add global IP rate limiting on auth endpoints | auth.actions.ts | 1 day | Security |

### Low Priority (v2.3)
| Item | Location | Effort | Impact |
|------|----------|--------|--------|
| Audit outbox for critical audit events | lib/audit.ts | 2 days | Data integrity |
| Pagination helper `createPaginatedQuery` | lib/pagination.ts | 1 day | DRY |
| Domain component dirs (admin/, employer/) | app/ | 1 day | Organization |

## Roadmap for v2

### v2.1 — Quality of Life
- DRY pagination boilerplate
- Notification helper extraction
- Standardize imports and naming
- Fix remaining file naming inconsistencies

### v2.2 — Enterprise Features
- Account deletion with GDPR compliance
- Notification outbox pattern
- Global rate limiting on auth endpoints
- Admin dashboard for audit log viewer

### v2.3 — Scale Prep
- Database read replicas support
- Background job queue for async operations
- Comprehensive API documentation
- End-to-end encryption for sensitive fields

### Ongoing
- Address npm vulnerabilities as patches become available
- Monitor performance budgets
- Iterate based on production data and user feedback
