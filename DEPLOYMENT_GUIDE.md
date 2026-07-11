# Deployment Guide

## Prerequisites
- Vercel account with project `work-force1`
- Neon PostgreSQL database
- GitHub repository with `main` branch

## Environment Variables

### Required (set in Vercel)
| Variable | Example Value | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@ep-holy-mud.aws.neon.tech/workforce` | PostgreSQL connection string |
| `JWT_SECRET` | `your-32-char-min-secret` | Secret for JWT token signing |
| `NEXT_PUBLIC_APP_URL` | `https://work-force1-ivory.vercel.app` | Public app URL (for CSRF + OG) |

### Optional — Required for full functionality
| Variable | Required For |
|----------|-------------|
| `RESEND_API_KEY`, `EMAIL_FROM` | Email OTP delivery |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image/document uploads |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Payment processing |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting |
| `SENTRY_DSN` | Error monitoring |

## Deployment Steps

### 1. Database
```bash
# Push schema to Neon
DATABASE_URL="postgresql://..." npx prisma db push

# (Optional) Seed sample data
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

### 2. Vercel
1. Connect GitHub repo to Vercel project
2. Set all required environment variables
3. Deploy from `main` branch
4. Verify at `https://work-force1-ivory.vercel.app`

### 3. Post-Deployment
1. Test health endpoint: `GET /api/health`
2. Test public pages: `/`, `/jobs`, `/login`
3. Verify CSRF protection works (test POST requests with invalid origin)
4. Set custom domain in Vercel dashboard (if desired)

## Production Readiness Checklist

- [ ] `NEXT_PUBLIC_APP_URL` set correctly
- [ ] Resend credentials configured (email OTP)
- [ ] Razorpay credentials configured (payments)
- [ ] Cloudinary credentials configured (uploads)
- [ ] Sentry DSN configured (error monitoring)
- [ ] Database migration strategy finalized (prisma migrate)
- [ ] Custom domain configured (or use provided vercel.app domain)
- [ ] Rate limiting verified with Redis (not in-memory fallback)
- [ ] SSL/TLS verified (Vercel provides automatically)

## Troubleshooting

### Build fails
- Check `DATABASE_URL` is set during build (Prisma generate needs it)
- Run `prisma generate` locally to verify schema

### "Something went wrong" on pages
- Check `DATABASE_URL` is correct and accessible
- Verify tables exist: `npx prisma db push`
- Check Vercel Runtime Logs for error details

### Auth redirect loop
- Verify `NEXT_PUBLIC_APP_URL` matches the deployed domain exactly
- Check that `workforce_token` cookie is being set properly

### Payments not working
- Verify both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
- Check `NEXT_PUBLIC_RAZORPAY_KEY_ID` matches the key ID
- Verify webhook endpoint is configured in Razorpay dashboard
