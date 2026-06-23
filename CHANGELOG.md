# Changelog

## v0.7.0 — 2026-06-23

- Consolidated to a single runtime (`src/main.js`); removed the unused legacy
  `web/app.js` / `web/styles.css` duplicate.
- Unified version to `0.7.0` across VERSION, package.json, manifest, README,
  index.html, release notes, and docs (was a 0.1.0 / 0.3.1 / v3 / v3.1 mix).
- Corrected the claims matrix: the live runtime is a real-time arcade engine and
  is **not** deterministic; verifiable-replay claims now point to the repos that
  actually have it (axonos-boundary-run-v64, axonos-e2e-demo).
- UX: added an on-menu controls hint; README rewritten to the AxonOS standard.

## v0.1.0 — 2026-06-23

- Initial AG0001 Chronos Boundary Flight implementation.
- Static local-only browser game.
- Vanilla canvas engine with fixed-step simulation.
- AxonOS concept mapping: typed intent, Privacy Vault, consent coherence, Zero Trust probes, latency pressure and unsafe stimulation envelope.
- GitHub Actions CI and Pages workflow.
