#!/usr/bin/env bash
set -euo pipefail

test -f README.md
test -f index.html
test -f src/main.js

grep -q 'https://axonos-bci.github.io/AG0001/' README.md || {
  echo "FAIL: README run button missing"
  exit 1
}

grep -Rqi 'no-telemetry' README.md index.html src docs || {
  echo "FAIL: no-telemetry marker missing"
  exit 1
}

node --check src/main.js

echo "OK: README RUN button present"
echo "OK: no-telemetry marker present"
echo "OK: static game verified"
