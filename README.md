# AG0001 — Chronos Boundary Flight v0.9.0

[![CI](https://github.com/AxonOS-BCI/AG0001/actions/workflows/ci.yml/badge.svg)](https://github.com/AxonOS-BCI/AG0001/actions/workflows/ci.yml)

Browser-native AxonOS arcade game: Chronos Boundary Flight.

A vertical ascent game where the pilot protects Boundary, Privacy, Consent, and Latency while flying through hostile interference and release gates.

## Play

https://axonos-bci.github.io/AG0001/?v=0.9.0

## Run

Local run serves the current `index.html` from this repository.

    git clone https://github.com/AxonOS-BCI/AG0001.git
    cd AG0001
    python3 -m http.server 8080

Open:

    http://127.0.0.1:8080/?v=0.9.0

If an old build is cached, open:

    http://127.0.0.1:8080/?fresh=1&v=0.9.0

## Verify

    bash scripts/verify.sh

## Controls

- Move: Left / Right or A / D
- Boost: Up or W
- Shield: S
- Mobile: touch controls appear automatically

## Scope

Educational browser game. No neural data. No sensors. No clinical claims. No telemetry.

## Version

Current version: `0.9.0`

## License

See [LICENSE](LICENSE).
