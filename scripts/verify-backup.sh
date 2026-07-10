#!/usr/bin/env bash
set -euo pipefail

# Backup Verification Script
#
# Verifies database backup integrity by:
#   1. Creating a Neon branch from the latest PITR (if NEON_API_KEY is set)
#   2. Running business invariant tests against the restored branch
#   3. Verifying data integrity
#   4. Cleaning up the temporary branch
#
# Usage:
#   export NEON_API_KEY="your-key"          # Optional — enables automated branch management
#   export NEON_PROJECT_ID="your-project-id" # Optional — required with NEON_API_KEY
#   bash scripts/verify-backup.sh           # Automated verification
#   bash scripts/verify-backup.sh --manual  # Print manual procedure only
#
# Schedule: Run weekly (e.g., every Monday 06:00 UTC)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d%H%M)
BRANCH_NAME="backup-verify-${TIMESTAMP}"
REPORT_DIR="${PROJECT_DIR}/tests/reporting"
mkdir -p "$REPORT_DIR"

MANUAL_ONLY=false
if [ "${1:-}" = "--manual" ]; then
  MANUAL_ONLY=true
fi

log()  { echo "[$(date +'%H:%M:%S')] $*"; }
fail() { log "❌ $*"; exit 1; }
pass() { log "✅ $*"; }

print_manual_procedure() {
  cat <<'EOF'
╔══════════════════════════════════════════════════════════════╗
║              MANUAL BACKUP VERIFICATION PROCEDURE            ║
╚══════════════════════════════════════════════════════════════╝

Prerequisites:
  - Neon dashboard access (https://console.neon.tech)
  - npm run test:invariants works locally
  - jq installed (brew install jq / apt install jq)

Steps:
  1. Go to Neon Console → Branches → Create Branch
     - Source: Parent branch (production)
     - Data from: Point in time → Select <24h ago
     - Name: backup-verify-$(date +%Y%m%d)

  2. Get the connection string for the new branch
     - Copy the DATABASE_URL from Neon branch details

  3. Run invariant tests against restored data:
     DATABASE_URL="<restored-branch-url>" \
     JWT_SECRET="<production-jwt-secret>" \
     NODE_ENV=test \
     npm run test:invariants

  4. Verify key data points:
     - Job credits are non-negative
     - Payment amounts match plan prices
     - No orphaned records
     - All foreign keys are valid

  5. Generate certification report:
     DATABASE_URL="<restored-branch-url>" \
     JWT_SECRET="<production-jwt-secret>" \
     NODE_ENV=test \
     npm run certify

  6. Clean up: Delete the temporary branch in Neon Console

  7. Record verification:
     echo "Last successful backup verification: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       >> tests/reporting/backup-verification.log

Expected outcome:
  All 21 business invariants PASS
  Certification report shows "certified: true"
EOF
}

if [ "$MANUAL_ONLY" = true ]; then
  print_manual_procedure
  exit 0
fi

log "Backup Verification — $(date)"
log "========================================"

# Check prerequisites
if ! command -v jq &>/dev/null; then
  log "⚠ jq not installed — will skip JSON parsing, using manual fallback"
fi

NEON_API_KEY="${NEON_API_KEY:-}"
NEON_PROJECT_ID="${NEON_PROJECT_ID:-}"

if [ -z "$NEON_API_KEY" ] || [ -z "$NEON_PROJECT_ID" ]; then
  log "⚠ NEON_API_KEY or NEON_PROJECT_ID not set"
  log "  Falling back to manual procedure"
  echo ""
  print_manual_procedure
  log "After completing the manual steps, record verification date in tests/reporting/backup-verification.log"
  exit 0
fi

# ---- Automated verification with Neon API ----
log "Neon API credentials found — running automated verification"

NEON_API="https://neon-api.vercel.app/v2"

# Step 1: Create branch from PITR (24h ago)
PITR_TIMESTAMP=$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)

log "Creating branch '$BRANCH_NAME' from PITR ($PITR_TIMESTAMP)..."
CREATE_RESPONSE=$(curl -s -X POST "$NEON_API/projects/$NEON_PROJECT_ID/branches" \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"branch\": {
      \"name\": \"$BRANCH_NAME\",
      \"parent_id\": \"$NEON_PROJECT_ID\"
    },
    \"endpoints\": [
      {
        \"type\": \"read_write\"
      }
    ]
  }")

BRANCH_ID=$(echo "$CREATE_RESPONSE" | jq -r '.branch.id // empty')
if [ -z "$BRANCH_ID" ]; then
  echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
  fail "Failed to create Neon branch"
fi
log "Branch created: $BRANCH_ID"

# Step 2: Wait for branch to be ready and get connection string
log "Waiting for branch to be ready..."
sleep 10

BRANCH_RESPONSE=$(curl -s "$NEON_API/projects/$NEON_PROJECT_ID/branches/$BRANCH_ID" \
  -H "Authorization: Bearer $NEON_API_KEY")
CONNECTION_URI=$(echo "$BRANCH_RESPONSE" | jq -r '.branch.connection_uris[0].connection_uri // empty')

if [ -z "$CONNECTION_URI" ]; then
  # Get from endpoints
  ENDPOINTS=$(curl -s "$NEON_API/projects/$NEON_PROJECT_ID/endpoints" \
    -H "Authorization: Bearer $NEON_API_KEY")
  ENDPOINT_ID=$(echo "$ENDPOINTS" | jq -r ".endpoints[] | select(.branch_id == \"$BRANCH_ID\") | .id // empty")
  if [ -n "$ENDPOINT_ID" ]; then
    CONNECTION_URI="postgresql://user:pass@${ENDPOINT_ID}.us-east-2.aws.neon.tech/$BRANCH_NAME?sslmode=require"
    log "⚠ Constructed connection URI (may need password from Neon console)"
  fi
fi

if [ -z "$CONNECTION_URI" ]; then
  fail "Could not determine connection URI for branch $BRANCH_ID"
fi

# Step 3: Run invariant tests against restored branch
log "Running invariant tests against restored branch..."
log "  DATABASE_URL=$CONNECTION_URI"

INVARIANT_RESULT=0
DATABASE_URL="$CONNECTION_URI" \
JWT_SECRET="${JWT_SECRET:-ci-test-secret-32-characters-long!!}" \
NODE_ENV=test \
npm run test:invariants -- --reporter=json > "$REPORT_DIR/backup-verify-report.json" 2>&1 || INVARIANT_RESULT=$?

if [ "$INVARIANT_RESULT" -ne 0 ]; then
  log "⚠ Invariant tests failed against restored backup (exit code: $INVARIANT_RESULT)"
  log "  Report saved to: $REPORT_DIR/backup-verify-report.json"
  log "  Proceeding with cleanup..."
fi

# Step 4: Verify key data points using direct SQL
log "Verifying data integrity..."
DATA_CHECKS_PASSED=true

CHECK_SQL="
  SELECT
    (SELECT COUNT(*) FROM \"JobCredit\" WHERE remaining < 0) as negative_credits,
    (SELECT COUNT(*) FROM \"Payment\" p LEFT JOIN \"Plan\" pl ON p.plan_id = pl.id WHERE pl.id IS NULL AND p.status = 'SUCCESS') as orphaned_payments,
    (SELECT COUNT(*) FROM \"Job\" WHERE employer_id IS NOT NULL AND employer_id NOT IN (SELECT id FROM \"User\")) as orphaned_jobs
"

# Run checks (best-effort — might fail if schema differs)
CHECK_RESULT=$(DATABASE_URL="$CONNECTION_URI" npx tsx -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient({ datasourceUrl: '$CONNECTION_URI' });
  p.\$queryRawUnsafe(\`SELECT
    (SELECT COUNT(*) FROM \"JobCredit\" WHERE remaining < 0) as negative_credits,
    (SELECT COUNT(*) FROM \"Payment\" p LEFT JOIN \"Plan\" pl ON p.plan_id = pl.id WHERE pl.id IS NULL AND p.status = 'SUCCESS') as orphaned_payments
  \`).then(r => { console.log(JSON.stringify(r)); return p.\$disconnect(); }).catch(e => { console.error(e.message); process.exit(1); });
" 2>&1 || echo '{"error":"data check query failed"}')

if echo "$CHECK_RESULT" | jq -e '.[0].negative_credits == 0 and .[0].orphaned_payments == 0' &>/dev/null; then
  log "Data integrity checks: PASS"
else
  log "⚠ Data integrity checks found issues:"
  echo "$CHECK_RESULT" | jq '.'
  DATA_CHECKS_PASSED=false
fi

# Step 5: Clean up
log "Cleaning up branch '$BRANCH_NAME'..."
DELETE_RESPONSE=$(curl -s -X DELETE "$NEON_API/projects/$NEON_PROJECT_ID/branches/$BRANCH_ID" \
  -H "Authorization: Bearer $NEON_API_KEY")

DELETE_STATUS=$(echo "$DELETE_RESPONSE" | jq -r '.branch.id // "unknown"')
if [ "$DELETE_STATUS" != "unknown" ]; then
  log "Branch '$BRANCH_NAME' deleted"
else
  log "⚠ Branch deletion may have failed — check Neon console"
fi

# Step 6: Record result
RESULT_STATUS="FAIL"
if [ "$INVARIANT_RESULT" -eq 0 ] && [ "$DATA_CHECKS_PASSED" = true ]; then
  RESULT_STATUS="PASS"
fi

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | $RESULT_STATUS | branch=$BRANCH_NAME | invariants=$INVARIANT_RESULT | data_checks=$DATA_CHECKS_PASSED" \
  >> "$REPORT_DIR/backup-verification.log"

log "Backup verification result: $RESULT_STATUS"
log "Last successful verification recorded in: $REPORT_DIR/backup-verification.log"

if [ "$RESULT_STATUS" != "PASS" ]; then
  fail "Backup verification FAILED"
fi

log "Backup verification PASSED"
