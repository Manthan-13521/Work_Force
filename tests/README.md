# Runtime Validation Framework

## Purpose

Certifies production readiness through execution instead of static inspection.
Every check is runnable, reusable, and integrated into CI/CD.

## Architecture

```
tests/
  invariants/          # Reusable business assertion library
    payment.ts         #  invariants
    credits.ts         #  invariants
    auth.ts            #  invariants
    jobs.ts            #  invariants
    tenants.ts         #  invariants
    applications.ts    #  invariants
    database.ts        #  invariants
    runner.ts          #  Orchestrator — runs all/specified invariants
    integration.test.ts #  vitest entry point for CI
    index.ts           #  Re-exports
  load/
    smoke-test.js      #  k6 scenario: 100 users, full business flow
  chaos/
    redis-outage.sh    #  Block Redis → verify graceful degradation
    db-latency.sh      #  Inject DB latency → verify correctness
    run-chaos.sh       #  Orchestrator
  reporting/
    generate-report.mjs  #  Combine k6 + invariants → certification report
```

## Commands

| Command | What it does |
|---|---|
| `npm run test:invariants` | Run all business invariants against the database |
| `npm run test:smoke` | Run k6 smoke test + invariant certification |
| `npm run test:certify` | Run invariants, output JSON report |
| `npm run test:chaos:redis` | Redis outage experiment |
| `npm run test:chaos:db` | DB latency experiment |
| `npm run test:chaos` | All chaos experiments + certification |
| `npm run test:all` | Unit + invariants + smoke |
| `npm run certify` | Invariants + report generation (exit code fails on violation) |

## CI/CD Pipeline

```
Build → Typecheck → Lint → Unit Tests → Invariant Tests → k6 Smoke → Certification Report → Deploy
```

If ANY invariant fails: deployment is blocked. The pipeline is defined in
`.github/workflows/ci.yml`.

## How to Add a New Invariant

1. Create `tests/invariants/<domain>.ts`
2. Export async functions accepting `(prisma, options?)`
3. Add to `tests/invariants/runner.ts` allInvariants array via `wrap()`
4. Re-export from `tests/invariants/index.ts`

Each invariant throws a descriptive error on failure, passes silently on success.

## How to Add a New Chaos Experiment

1. Create `tests/chaos/<experiment>.sh`
2. Inject the failure mode
3. Run the k6 smoke test
4. Run invariant checks
5. Restore the system
6. Add to `tests/chaos/run-chaos.sh`

## How to Extend Reporting

1. Add data source to `tests/reporting/generate-report.mjs`
2. Add new failure category to `categorizeFailures()`
3. Update the report schema in the output

## Non-Blocking Observations

Any production code improvements discovered while building this framework
should be documented here, not implemented. The goal is runtime certification,
not refactoring.
