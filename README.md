# Workforce

Production-grade blue-collar hiring platform connecting industrial workers with verified employers in Hyderabad.

## Stack

- **Framework**: Next.js 16.2.9 (App Router)
- **Language**: TypeScript (strict mode, zero `any`)
- **Database**: PostgreSQL + Prisma 7 ORM
- **Auth**: JWT (7-day expiry) + Email OTP (via Resend)
- **Cache**: Upstash Redis (OTP storage, rate limiting)
- **Payments**: Razorpay
- **Uploads**: Local filesystem (`public/uploads/`)
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest (26 unit tests)

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Upstash Redis account (or local Redis)
- Resend account (for email OTP)
- Razorpay account (for payments)

## Setup

```bash
# Install dependencies
npm install

# Copy env vars
cp .env.example .env
# Edit .env with your credentials

# Push schema to database
npm run db:push

# Seed demo data
npm run db:seed

# Start dev server
npm run dev
```

## Environment Variables

See `.env.example` for all required vars. Key ones:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32 characters |
| `UPSTASH_REDIS_REST_URL` | ✅ | Redis REST URL (OTP/rate limits) |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Redis auth token |
| `RAZORPAY_KEY_ID` | ⬜ | Required for payments |
| `RAZORPAY_KEY_SECRET` | ⬜ | Required for payments |
| `RESEND_API_KEY` | ⬜ | Required for email OTP |
| `EMAIL_FROM` | ⬜ | Sender email for OTP |

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm test` | Run unit tests |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## Architecture

```
src/
├── actions/       # Server actions (business logic)
├── app/           # Next.js App Router pages
│   ├── (auth)/    # Login, Register, Verify-OTP
│   ├── (public)/  # Home, Jobs, Workers, Pricing, About, Contact
│   ├── admin/     # Admin dashboard + management
│   ├── api/       # API routes (webhooks, OTP, health)
│   ├── employer/  # Employer dashboard + job management
│   └── worker/    # Worker dashboard + profile
├── components/    # Shared UI components
│   ├── layout/    # Navbar, Footer
│   ├── shared/    # Badge, EmptyState, ErrorState, Pagination
│   └── ui/        # Button, Card, Input, Textarea
└── lib/           # Utilities, auth, prisma, redis, schemas
```

## Deployment

Recommended: Vercel

```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod
```

### Pre-deployment checklist
1. Ensure all env vars are set in Vercel dashboard
2. Run `npx prisma db push` against production DB
3. Run `npm run db:seed` for initial data
4. Set `NODE_ENV=production`
5. Verify health endpoint: `GET /api/health`

## Health Check

`GET /api/health` returns `{ status: "ok", db: <ms> }` or `503` if database is unreachable.

## Testing

```bash
npm test           # Run once
npm run test:watch # Watch mode
```

## License

Private — internal use only.
