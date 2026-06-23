#!/usr/bin/env bash
set -euo pipefail

test -f README.md
test -f index.html
test -f src/main.js
test -f docs/NO_TELEMETRY.md
test -f VERSION

grep -q 'https://axonos-bci.github.io/AG0001/' README.md || {
  echo "FAIL: README RUN button missing"
  exit 1
}

grep -q 'id="game"' index.html || {
  echo "FAIL: index.html missing canvas id=game"
  exit 1
}

grep -q 'src/main.js' index.html || {
  echo "FAIL: index.html does not load src/main.js"
  exit 1
}

grep -Rqi 'no-telemetry' README.md index.html src docs || {
  echo "FAIL: no-telemetry marker missing"
  exit 1
}

# Critical regression guard: runtime must not be swallowed by a single-line // comment.
first_line="$(head -n 1 src/main.js)"
case "$first_line" in
  "// no-telemetry"*)
    echo "FAIL: src/main.js starts with single-line comment marker. Use block marker."
    exit 1
    ;;
esac

grep -q '(() => {' src/main.js || {
  echo "FAIL: executable IIFE missing"
  exit 1
}

grep -q 'function boot' src/main.js || {
  echo "FAIL: boot function missing"
  exit 1
}

if command -v node >/dev/null 2>&1; then
  node --check src/main.js
else
  echo "WARN: node not installed locally; skipping JS syntax check"
fi

echo "OK: AG0001 v0.7.0 runtime verified"
