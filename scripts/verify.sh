#!/usr/bin/env bash
set -euo pipefail
test -f README.md
test -f index.html
test -f src/main.js
test -f docs/NO_TELEMETRY.md
test -f VERSION
grep -q 'https://axonos-bci.github.io/AG0001/' README.md
grep -q 'src/main.js' index.html
grep -Rqi 'no-telemetry' README.md index.html src docs
if command -v node >/dev/null 2>&1; then node --check src/main.js; else echo "WARN: node not installed locally"; fi
echo "OK: AG0001 v3 verified"
