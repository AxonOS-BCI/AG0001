# AxonOS AG0001 — Chronos Boundary Flight

**Version:** `v0.1.0`  
**Repository:** `https://github.com/AxonOS-BCI/AG0001`  
**Product type:** local-only browser game / public AxonOS reference experience  
**Owner / IP:** Denis Yermakou / AxonOS  
**Jurisdiction:** Singapore

> Fly upward. Preserve the boundary. Release typed intent, never raw signal.

## What this is

AG0001 is a fast, playable browser game that turns the AxonOS thesis into an interactive experience.

The player controls the **Chronos craft**, a precision aircraft moving upward through a neural boundary corridor. The game feels like an upward-flight arcade game, but the objects are AxonOS concepts:

- **Typed Intent gates** are safe cognition crossing the application boundary.
- **Raw Signal shards** represent private neural data that must never leak.
- **Zero Trust probes** represent permission escalation attempts.
- **Latency fields** represent real-time overload and WCET pressure.
- **Unsafe stimulation waves** represent output that must remain inside a safety envelope.
- **Privacy Vault** and **Consent Coherence** are live telemetry metrics.

## Gameplay

Reach `9,000 m` and open the release window while keeping:

- Boundary Integrity stable;
- Privacy Vault intact;
- Consent Coherence high;
- Raw Leak Risk low;
- Stimulation Risk low;
- Latency Pressure under control.

## Controls

| Input | Action |
|---|---|
| `← / →` or `A / D` | steer |
| `↑` or `W` | boost |
| `↓` or `S` | shield brake |
| `Space` | pause / resume |
| `Enter` | release sovereignty when stable |
| Touch buttons | mobile steering, boost, shield |

## Engine notes

The game uses a custom vanilla JavaScript canvas engine:

- fixed-step simulation at `60 Hz`;
- frame-rate-independent physics;
- seeded deterministic obstacle generation;
- inertial aircraft handling with thrust, drag, banking and shield braking;
- no external libraries;
- no external assets;
- no telemetry;
- no backend;
- no wallet connection;
- no third-party scripts or CDNs.

This first `AG0001` version is intentionally static and GitHub Pages friendly. A later version can move the scoring/state core into Rust/WASM, but this package does not overclaim that the browser runtime is Rust-authoritative.

## Run locally

```bash
python3 -m http.server 8080
```

Open:

```text
http://127.0.0.1:8080/
```

## Verify

```bash
bash scripts/verify.sh
```

## GitHub Pages

The repository includes `.github/workflows/pages.yml`. After pushing, set:

```text
Settings → Pages → Source → GitHub Actions
```

Live URL target:

```text
https://axonos-bci.github.io/AG0001/
```

## Public claims boundary

This repository is an educational game and brand/reference experience. It does **not** claim:

- medical device functionality;
- clinical validation;
- diagnosis or treatment;
- real EEG/BCI ingestion;
- hardware stimulation control;
- production BCI integration;
- investment, token, gambling, yield or payment mechanics.

## License / IP

The source is published for inspection and demonstration. AxonOS names, marks, visual identity, gameplay concept, private policy packs, and commercial deployment material remain proprietary unless a separate written license is granted.

See `LICENSE`, `IP_NOTICE.md`, `PRIVACY_NOTICE.md`, and `SECURITY.md`.
