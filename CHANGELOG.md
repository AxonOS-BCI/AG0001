# Changelog

## v1.2.0 — Credits & Hangar
- New credits economy: collect golden coin pickups mid-flight and earn run bonuses (altitude, score, combo, win).
- Hangar unlocks: spend credits to unlock the Velocity / Fortress / Sovereign loadouts; balances persist locally.
- Pause anytime (⏸ button or Esc / P) with Resume / Restart / Menu.
- UX: credit balance in the Hangar, +credits count-up on results, coin magnet, clearer onboarding.
- Stability: fixed a zone-index crash (`Cannot read properties of undefined (reading 'n')`); update/draw now run inside guarded try/catch.


## v1.1.0 — Elite Edition
- New momentum-based flight engine and smoother handling.
- Removed on-screen control pads; control is drag-to-steer + tap (shield) + double-tap (boost), plus keyboard.
- Premium glass UI, animated four-meter HUD (Boundary / Privacy / Consent / Latency), minimap.
- Cinematics: animated intro, zone-transition banners, slow-motion beats, win/defeat sequences, particles, screen shake.
- Optional Dogecoin support modal after the third run (nothing is gated).
- CI: fixed job 04 (inline-script extraction) and consolidated to the single-file runtime.


## v0.7.0 — 2026-06-23

- Consolidated to a single runtime (`index.html (inline)`); removed the unused legacy
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
