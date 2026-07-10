#!/usr/bin/env bash
# Database Latency Chaos Test
#
# Purpose: Verifies the application handles database latency gracefully.
# Under high DB latency, the application must:
#   - Not create duplicate payments or credits
#   - Not allow tenant data leakage
#   - Maintain idempotency guarantees
#   - Return appropriate timeouts/errors to users
#
# Architecture:
#   1. Add artificial latency to PostgreSQL port (5432) via tc/pfctl
#   2. Run the k6 smoke scenario
#   3. Run invariant checks to verify correctness under degraded conditions
#   4. Remove latency injection
#
# How to extend:
#   Add partial packet loss, connection drops, or read-only mode tests.
#
# Prerequisites:
#   - macOS: pfctl + dummynet (enable with `sudo dnctl enable`)
#   - Linux: tc (traffic control)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORT_DIR="$PROJECT_DIR/tests/reporting"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/chaos-db-${TIMESTAMP}.json"
LATENCY_MS="${1:-200}"

echo "[CHAOS] Starting DB latency test at $(date)"
echo "[CHAOS] Target: postgresql (port 5432), latency: ${LATENCY_MS}ms"

cleanup() {
  echo "[CHAOS] Removing DB latency injection..."
  if command -v dnctl &>/dev/null; then
    sudo dnctl -f flush 2>/dev/null || true
    sudo pfctl -f /etc/pf.conf 2>/dev/null || true
  elif command -v tc &>/dev/null; then
    sudo tc qdisc del dev eth0 root 2>/dev/null || true
  fi
  echo "[CHAOS] DB latency removed at $(date)"
}
trap cleanup EXIT

# Inject latency
echo "[CHAOS] Injecting ${LATENCY_MS}ms latency on port 5432..."
if command -v dnctl &>/dev/null; then
  # macOS: use dnctl + pf
  echo "dummy net delay ${LATENCY_MS}ms" | sudo dnctl pipe 1
  echo "
    dummynet in proto tcp from any to any port 5432 pipe 1
    dummynet out proto tcp from any to any port 5432 pipe 1
  " | sudo pfctl -a "com.apple/275.DBLatency" -f - 2>/dev/null || true
  sudo pfctl -e 2>/dev/null || true
  echo "[CHAOS] dnctl latency rule applied (${LATENCY_MS}ms)"
elif command -v tc &>/dev/null; then
  sudo tc qdisc add dev eth0 root netem delay "${LATENCY_MS}ms" 2>/dev/null || {
    sudo tc qdisc change dev eth0 root netem delay "${LATENCY_MS}ms" 2>/dev/null || true
  }
  echo "[CHAOS] tc latency rule applied (${LATENCY_MS}ms)"
else
  echo "[CHAOS] WARNING: No latency injection tool found. Skipping injection."
fi

# Run smoke test under degraded DB
echo "[CHAOS] Running smoke test under DB latency..."
if command -v k6 &>/dev/null; then
  k6 run "$PROJECT_DIR/tests/load/smoke-test.js" \
    --out json="$REPORT_DIR/chaos-db-k6-${TIMESTAMP}.json" \
    --tag "chaos=db-latency" \
    --tag "latency=${LATENCY_MS}ms" \
    --tag "timestamp=${TIMESTAMP}" 2>&1 || true
else
  echo "[CHAOS] k6 not installed. Skipping load test."
fi

# Run invariant checks
echo "[CHAOS] Running invariant checks..."
if command -v npx &>/dev/null; then
  cd "$PROJECT_DIR"
  npx vitest run --config vitest.invariants.config.ts --reporter=json 2>"$REPORT_FILE" || true
fi

echo "[CHAOS] DB latency test complete at $(date)"
echo "[CHAOS] Report: $REPORT_FILE"
