<div align="center">

# ⟁ &nbsp;AG0001 — Chronos Boundary Flight

**A browser-native AxonOS arcade — Elite Edition.** &nbsp;One file. &nbsp;Zero network. &nbsp;Zero telemetry.

[![CI](https://github.com/AxonOS-BCI/AG0001/actions/workflows/ci.yml/badge.svg)](https://github.com/AxonOS-BCI/AG0001/actions/workflows/ci.yml)
[![version](https://img.shields.io/badge/version-1.1.0-1f6feb)](https://github.com/AxonOS-BCI/AG0001/releases)
[![license](https://img.shields.io/badge/license-MIT-3fb950)](LICENSE)
[![runtime](https://img.shields.io/badge/runtime-single--file_HTML-8957e5)](index.html)
[![telemetry](https://img.shields.io/badge/telemetry-none-3fb950)](#not-a-medical-device)
[![scope](https://img.shields.io/badge/scope-educational_artifact-d29922)](#not-a-medical-device)

### [▶ &nbsp;Play in your browser](https://axonos-bci.github.io/AG0001/?v=1.1.0)

*Educational / brand artifact — **not a medical device**. No neural data, no sensors, no clinical claims.*

</div>

---

## Overview

A single self-contained `index.html` — HTML, CSS and inline JavaScript, with **no build step, no bundler, no dependencies, and no network calls**. You pilot a sovereign signal upward through a hostile boundary field, dodging hazards while four integrity meters drain and recover. Everything — engine, cinematics, UI — lives in one readable file.

## What's new in v1.1.0 — Elite Edition

- **New flight engine** — momentum-based handling with smoothed steering and tilt.
- **Pads removed.** Control is now **drag to steer**, **tap = shield**, **double-tap = boost** — plus full keyboard support.
- **Premium UI** — glassmorphic panels, an animated four-meter HUD (Boundary / Privacy / Consent / Latency), and a live minimap.
- **Cinematics** — animated intro, zone-transition banners, slow-motion beats on near-misses and shields, and win/defeat sequences with particles and screen shake.
- **Optional Dogecoin support** — a gentle support modal appears after your third run. Nothing is gated; the whole game stays free.

## The AxonOS metaphor

The four HUD meters mirror real concerns from the AxonOS architecture — as a *dramatization*, not the real system:

| HUD meter | In the game | AxonOS concept it gestures at |
|-----------|-------------|-------------------------------|
| **Boundary** | Hull integrity vs. hazards | The hard boundary between user and system |
| **Privacy** | Drains in exposed zones | On-device-only data, nothing leaves the edge |
| **Consent** | Fuels boost & shield | Consent enforced *below* the coupling engine |
| **Latency** | Spikes under stress | Hard real-time deadlines |

The real, replay-verified engines live in [`axonos-boundary-run-v64`](https://github.com/AxonOS-BCI/axonos-boundary-run-v64) and [`axonos-e2e-demo`](https://github.com/AxonOS-org/axonos-e2e-demo). This repo is the playful front door, not the engineering.

## Controls

| Action | Keyboard | Touch |
|--------|----------|-------|
| Steer | `←` `→` &nbsp;/&nbsp; `A` `D` | **drag** anywhere |
| Boost | `↑` &nbsp;/&nbsp; `W` | **double-tap** |
| Shield | `↓` &nbsp;/&nbsp; `S` &nbsp;/&nbsp; `Space` | **tap** |

## Run

No toolchain required — it is one static file:

```bash
git clone https://github.com/AxonOS-BCI/AG0001.git
cd AG0001
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080`. &nbsp;(Or just [play the hosted build](https://axonos-bci.github.io/AG0001/?v=1.1.0).)

## Architecture

- **Single file.** Markup, styling, engine, cinematics — all in `index.html`.
- **Deterministic core.** xorshift PRNG (BigInt) with an integer fallback.
- **Canvas 2D loop** with momentum physics, particles, parallax, and screen shake.
- **Visible error reporter.** Any runtime error surfaces as an on-screen banner — never a blank screen.
- **Local only.** No requests of any kind; high scores live in `localStorage` and are never transmitted.

## Verify

Every claim above is gate-checked — 12 CI jobs plus a deploy-time `scripts/verify.sh`:

```bash
bash scripts/verify.sh      # version, integrity, inline-JS syntax
sha256sum -c SHA256SUMS     # release manifest
```

CI also enforces a dependency-free tree, a secret scan, LF line endings, and a file-size budget. Live status: the **CI** badge above.

## Not a medical device

AG0001 is an **educational and brand artifact**. It contains no neural interface, no sensors, and collects no data. Nothing here is a medical claim, a clinical result, or a description of a shipping product.

## Version

Current version: `1.1.0`

## Related

[axonos.org](https://axonos.org) &nbsp;·&nbsp; [medium.com/@AxonOS](https://medium.com/@AxonOS) &nbsp;·&nbsp; [axonos-boundary-run-v64](https://github.com/AxonOS-BCI/axonos-boundary-run-v64) &nbsp;·&nbsp; [axonos-e2e-demo](https://github.com/AxonOS-org/axonos-e2e-demo)

---

<div align="center">

© The AxonOS Project / Denis Yermakou &nbsp;·&nbsp; axonos.org &nbsp;·&nbsp; connect@axonos.org &nbsp;·&nbsp; security@axonos.org

</div>
