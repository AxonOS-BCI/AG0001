# AG0001 — Chronos Boundary Flight

[![CI](https://github.com/AxonOS-BCI/AG0001/actions/workflows/ci.yml/badge.svg)](https://github.com/AxonOS-BCI/AG0001/actions/workflows/ci.yml)

**AG0001** is a browser-native AxonOS game prototype: a vertical ascent flight where the player crosses cognitive boundaries, avoids hostile interference, and keeps the neural control loop stable.

## Run

```bash
git clone https://github.com/AxonOS-BCI/AG0001.git
cd AG0001
python3 -m http.server 8080
```

Open:

```text
http://127.0.0.1:8080
```

Controls:

```text
Arrow Left / A   — move left
Arrow Right / D  — move right
Space            — restart after crash
```

## Concept

Chronos Boundary Flight is not just an arcade runner. It is a playable metaphor for AxonOS:

- the aircraft represents the cognitive runtime;
- obstacles represent noisy, unsafe, or unauthorized signal boundaries;
- stability represents low-latency neural control;
- ascent represents progression from raw signal to protected intent;
- failure represents loss of deterministic control.

## Repository Contract

This repository must stay runnable without build tools.

Required files:

```text
README.md
index.html
src/main.js
.github/workflows/ci.yml
VERSION
LICENSE
SHA256SUMS
```

## CI Surface — 12 Jobs

The CI workflow contains exactly 12 jobs:

1. repository contract
2. README run block
3. HTML integrity
4. JavaScript syntax
5. static runtime smoke test
6. dependency-free check
7. lightweight secret scan
8. line-ending check
9. file-size budget
10. license presence
11. version consistency
12. SHA256 release manifest

## Version

Current version: `0.1.0`
