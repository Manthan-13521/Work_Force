#!/usr/bin/env bash
# Chaos Test Orchestrator
#
# Runs all chaos experiments sequentially and produces a combined report.
#
# Usage: bash tests/chaos/run-chaos.sh [db-latency-ms]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORT_DIR="$PROJECT_DIR/tests/reporting"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
COMBINED_REPORT="$REPORT_DIR/chaos-combined-${TIMESTAMP}.json"

echo "=========================================="
echo "  Chaos Test Suite — $(date)"
echo "=========================================="
echo ""

RESULTS=()

# 1. Redis Outage
echo "──────────────────────────────────────────"
echo "  Experiment 1: Redis Unavailable"
echo "──────────────────────────────────────────"
bash "$SCRIPT_DIR/redis-outage.sh" && RESULTS+=("redis:passed") || RESULTS+=("redis:failed")
echo ""

# 2. DB Latency
echo "──────────────────────────────────────────"
echo "  Experiment 2: Database Latency"
echo "──────────────────────────────────────────"
bash "$SCRIPT_DIR/db-latency.sh "${1:-200}" && RESULTS+=("db:passed") || RESULTS+=("db:failed")
echo ""

# Build report
echo "=========================================="
echo "  Chaos Test Results"
echo "=========================================="
for r in "${RESULTS[@]}"; do
  echo "  - ${r}"
done

cat > "$COMBINED_REPORT" <<EOF
{
  "phase": "chaos",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "experiments": [
EOF

first=true
for exp in redis db; do
  $first || echo "," >> "$COMBINED_REPORT"
  first=false
  echo "    { \"name\": \"$exp-outage\", \"passed\": $(echo "${RESULTS[@]}" | grep -q "$exp:passed" && echo true || echo false) }" >> "$COMBINED_REPORT"
done

echo "  ]" >> "$COMBINED_REPORT"
echo "}" >> "$COMBINED_REPORT"

echo ""
echo "Combined report: $COMBINED_REPORT"
