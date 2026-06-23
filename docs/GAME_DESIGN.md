# AG0001 Game Design — Chronos Boundary Flight

## Core fantasy

The player is not shooting enemies. The player is piloting a high-precision cognitive aircraft through a hostile neural boundary. The feeling should be closer to a premium aerospace instrument than a cheap arcade toy.

## Why upward flight

Upward flight creates constant pressure and immediate readability:

```text
climb = progress
smooth steering = cognitive continuity
boost = performance / latency tradeoff
shield brake = privacy/security tradeoff
impact = boundary damage
release window = stable sovereignty state
```

## AxonOS mapping

| Game object | AxonOS meaning |
|---|---|
| Chronos craft | application-visible intent carrier |
| Typed Intent gate | scoped permission / safe intent packet |
| Raw shard | raw neural signal exposure |
| Zero Trust probe | permission escalation/adversarial request |
| Latency field | WCET / real-time overload pressure |
| Unsafe stim wave | unsafe output/stimulation request |
| Shield brake | Privacy Vault + Neural Permissions guardrail |
| Release window | safe application boundary export |

## Engine requirements implemented

- Fixed `60 Hz` simulation.
- Renderer uses `requestAnimationFrame`, but gameplay is independent of frame rate.
- Seeded RNG controls route generation.
- Aircraft has inertia, drag, acceleration, max velocity, boost heat and shield charge.
- Collisions use simple circle/rectangle checks for reliable arcade readability.
- Metrics clamp to `0..100`.
- Final outcome is driven by metrics, not only score.
- Canvas renderer uses no external engine.
- Mobile controls use pointer events and explicit buttons.

## Playability details

- The craft stays in the lower third of the screen to create forward visibility.
- Obstacles spawn by altitude, not by frames.
- Boost is useful but raises latency heat.
- Shield brake helps survival but costs speed and charge.
- Typed intent gates reward central flight and restore coherence.
- Zero Trust probes are silver, intentionally visually attractive, but dangerous.
- The release window opens only when altitude and sovereignty metrics are stable.

## Next engineering upgrades

1. Move deterministic scoring/state into a Rust/WASM core.
2. Add replay vectors and state-hash verification fixtures.
3. Add scenario editor with deterministic seed export.
4. Add richer obstacle grammar: moving gates, policy forks, audit windows.
5. Add Web Audio engine model with muted-by-default oscillator synthesis.
6. Add social preview image and release art.
