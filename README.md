<div align="center">

# AG0001 — Chronos Boundary Flight

<a href="https://axonos-bci.github.io/AG0001/">
  <img src="https://img.shields.io/badge/RUN-PLAY%20GAME-c8a96a?style=for-the-badge&labelColor=08090c" alt="RUN — PLAY GAME">
</a>

[![CI](https://github.com/AxonOS-BCI/AG0001/actions/workflows/ci.yml/badge.svg)](https://github.com/AxonOS-BCI/AG0001/actions/workflows/ci.yml)

**A browser-native AxonOS arcade: a vertical ascent where you cross cognitive boundaries, hold the control loop stable, and keep your Boundary, Privacy, Consent, and Latency intact to the top.**

</div>

---

> **What this is.** An **educational / brand artifact** of the AxonOS project — a fast, self-contained arcade game that dramatises the AxonOS ideas (a defended boundary, consent, privacy, latency) as something you play. It is **not** a brain-computer interface, uses no neural data, and is **not** evidence of BCI functionality.

## Play

In the browser: **[axonos-bci.github.io/AG0001](https://axonos-bci.github.io/AG0001/)**.

## Run

Locally — a single static page, no build step, **no-telemetry**, no network calls:

```bash
git clone https://github.com/AxonOS-BCI/AG0001.git
cd AG0001
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080`.

## How to play

- **Move:** `←` `→` or **A / D**.
- **Boost:** `↑` or **W** — climb faster, burn the boost gauge.
- **Shield:** `↓` or **S** — absorb interference on a cooldown.
- On mobile, four touch pads appear (move / boost / shield).
- **Goal:** ascend through the boundary layers, dodge hostile interference, keep the four AxonOS metrics above zero, and reach release authorization. Pick a **loadout** (Balanced / Velocity / Fortress / Sovereign) and a **difficulty** from the menu.

## The four AxonOS metrics

The HUD tracks four bars that make the AxonOS thesis legible while you fly:

| Metric | What it dramatises |
|:--|:--|
| **Boundary** | Integrity of the line between raw signal and typed intent. |
| **Privacy** | Data staying on-device — the game itself is zero-telemetry. |
| **Consent** | Operation only while consent holds. |
| **Latency** | Staying inside a real-time budget. |

## Honest scope

- **Real-time arcade engine.** `src/main.js` runs on a variable-timestep render loop. It is fun, but it is **not** deterministic and does not produce a verifiable replay. AxonOS' deterministic, cryptographically replay-verified engine is demonstrated where it actually exists — in [axonos-boundary-run-v64](https://github.com/AxonOS-BCI/axonos-boundary-run-v64) and the reproducible [axonos-e2e-demo](https://github.com/AxonOS-org/axonos-e2e-demo).
- **No neural data, no clinical claim, not a medical device.**
- **Privacy:** runs entirely in your browser — no accounts, no analytics, **no-telemetry** by construction (see [`docs/NO_TELEMETRY.md`](docs/NO_TELEMETRY.md)).

## Layout

| Path | What |
|:--|:--|
| `index.html` | Self-contained game shell: inline styles, HUD, menus — loads `src/main.js` |
| `src/main.js` | The arcade runtime (movement, loadouts, difficulty, shield/boost, minimap, mobile) |
| `docs/` | `GAME_DESIGN.md`, `CLAIMS_MATRIX.md`, `NO_TELEMETRY.md` |
| `scripts/verify.sh` | Repository contract checks |
| `SHA256SUMS` | Hashes of the shipped files |

## Verify

```bash
bash scripts/verify.sh
sha256sum -c SHA256SUMS
```

CI runs the full contract on every push (required files, run block, no-telemetry, version consistency, SHA-256 manifest).

## The real AxonOS

This is a game, not the platform. The engineering lives under [**AxonOS-org**](https://github.com/AxonOS-org): the [Standard](https://github.com/AxonOS-org/axonos-standard), the Rust `#![no_std]` [kernel](https://github.com/AxonOS-org/axonos-kernel), the [consent FSM](https://github.com/AxonOS-org/axonos-consent), the [SDKs](https://github.com/AxonOS-org/axonos-sdk), and a reproducible [end-to-end intent-flow demo](https://github.com/AxonOS-org/axonos-e2e-demo).

## Version

Current version: `0.7.0`

## License

See [LICENSE](LICENSE). Created by **Denis Yermakou** for the AxonOS Project.

---

<div align="center">
<sub>© The AxonOS Project / Denis Yermakou · <a href="https://axonos.org">axonos.org</a> · connect@axonos.org · security@axonos.org</sub>
</div>
