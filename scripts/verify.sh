#!/usr/bin/env bash
set -Eeuo pipefail

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

required_files=(
  index.html
  web/app.js
  web/styles.css
  manifest.webmanifest
  README.md
  RELEASE_NOTES.md
  CHANGELOG.md
  docs/GAME_DESIGN.md
  docs/CLAIMS_MATRIX.md
  PRIVACY_NOTICE.md
  SECURITY.md
  IP_NOTICE.md
  LICENSE
  VERSION
)

for file in "${required_files[@]}"; do
  [[ -s "$file" ]] || fail "missing or empty: $file"
done

version="$(cat VERSION | tr -d '[:space:]')"
[[ "$version" == "0.1.0" ]] || fail "VERSION must be 0.1.0"

grep -q "Chronos Boundary Flight" index.html || fail "index title missing"
grep -q "NO TELEMETRY\|no telemetry\|No telemetry" index.html README.md PRIVACY_NOTICE.md || fail "no-telemetry marker missing"
grep -q "No real neural data\|no real neural data" index.html README.md docs/CLAIMS_MATRIX.md || fail "no-real-neural-data marker missing"
grep -q "not a medical\|medical device" README.md docs/CLAIMS_MATRIX.md || fail "medical exclusion missing"
grep -q "FIXED_DT = 1 / 60" web/app.js || fail "fixed-step marker missing"
grep -q "mulberry32" web/app.js || fail "seeded RNG missing"
grep -q "TARGET_ALTITUDE" web/app.js || fail "target altitude missing"

scan_files=$(find . -type f ! -path './.git/*' ! -path './scripts/verify.sh')

if grep -InE "google-analytics|gtag|walletconnect|metamask|stripe|firebase|sentry|segment|mixpanel|cdn\.jsdelivr|unpkg|cdnjs" $scan_files; then
  fail "forbidden external runtime dependency or telemetry/payment marker found"
fi

if grep -InE "FDA approved|guaranteed return|token sale|staking reward|yield farming|airdrop reward|diagnoses disease|treats disease" $scan_files; then
  fail "forbidden public claim found"
fi

if command -v node >/dev/null 2>&1; then
  node --check web/app.js
else
  echo "WARN: node unavailable; skipping JS syntax check"
fi

echo "PASS: AG0001 Chronos Boundary Flight v0.1.0 verification complete"
