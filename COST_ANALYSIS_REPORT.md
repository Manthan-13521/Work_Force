# Cost Analysis Report

## Estimated Monthly Infrastructure Costs

### Workload Assumptions
- 100k requests/day average
- 100 concurrent users peak
- PostgreSQL managed database
- Upstash Redis (serverless)
- Cloudinary image storage
- Vercel hosting

### Cost Breakdown

| Resource | 100 Users | 1,000 Users | 10,000 Users | 100,000 Users |
|----------|-----------|-------------|--------------|----------------|
| **Database** (PostgreSQL) | $15/mo | $50/mo | $200/mo | $800/mo |
| **Redis** (Upstash) | $5/mo | $15/mo | $50/mo | $200/mo |
| **Hosting** (Vercel Pro) | $20/mo | $50/mo | $200/mo | Custom |
| **Cloudinary** | $0 (free tier) | $25/mo | $100/mo | $400/mo |
| **Sentry** | $0 (free tier) | $26/mo | $100/mo | $400/mo |
| **PostHog** | $0 (self-host) | $0 (self-host) | $100/mo | $500/mo |
| **MSG91 SMS** | $10/mo | $50/mo | $300/mo | $2,000/mo |
| **Razorpay** | 2% per tx | 2% per tx | 2% per tx | 2% per tx |
| **Bandwidth** | included | included | $50/mo | $200/mo |
| **Total (est.)** | **$50/mo** | **$216/mo** | **$1,000/mo** | **$4,500/mo** |

### Cost Optimization Recommendations

| Area | Recommendation | Savings |
|------|---------------|---------|
| **Database** | Use connection pooling (PgBouncer) at scale | 30-50% connection overhead |
| **Redis** | Switch to Upstash Fixed Size at 10k+ users | ~30% vs serverless |
| **Images** | Implement client-side image compression before upload | 40-60% bandwidth savings |
| **Caching** | Increase cache TTLs for low-churn data (categories, cities) | Reduces DB reads ~40% |
| **Sentry** | Sample errors at 50% for non-critical paths | 50% volume reduction |
| **SMS** | Batch non-urgent notifications into daily digest | 70% fewer SMS |
| **Hosting** | Consider Vercel Enterprise at 100k+ for committed pricing | 15-25% discount |

### Key Drivers
1. **SMS costs dominate at scale** — each OTP costs ~₹0.50-1.00
2. **Database IO scales linearly** with job postings and applications
3. **Image CDN** costs grow with worker photo uploads
4. **Transaction fees** are percentage-based (2% of payment volume)
