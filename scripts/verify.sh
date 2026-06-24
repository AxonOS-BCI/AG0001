#!/usr/bin/env bash
set -euo pipefail

test -f README.md
test -f index.html
test -f VERSION

grep -q 'Chronos Boundary Flight v0.9.0' index.html || { echo 'FAIL: index.html is not v0.9.0'; exit 1; }
grep -q '</html>' index.html || { echo 'FAIL: index.html is truncated'; exit 1; }
grep -q 'Current version: `0.9.0`' README.md || { echo 'FAIL: README version mismatch'; exit 1; }
grep -q 'https://axonos-bci.github.io/AG0001/?v=0.9.0' README.md || { echo 'FAIL: README play link mismatch'; exit 1; }
grep -q '^0.9.0$' VERSION || { echo 'FAIL: VERSION mismatch'; exit 1; }

TMP_JS="${TMPDIR:-$PWD/.tmp}/ag0001-inline-check.js"
mkdir -p "$(dirname "$TMP_JS")"
export TMP_JS
python3 - <<'PY'
from pathlib import Path
import os
s = Path('index.html').read_text(encoding='utf-8')
a = s.index('<script>') + len('<script>')
b = s.rindex('</script>')
Path(os.environ['TMP_JS']).write_text(s[a:b], encoding='utf-8')
PY

if command -v node >/dev/null 2>&1; then
  node --check "$TMP_JS"
else
  echo 'WARN: node unavailable; skipping JS syntax check'
fi

echo 'OK: AG0001 v0.9.0 single-file runtime verified'
