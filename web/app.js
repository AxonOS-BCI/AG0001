(() => {
  "use strict";

  const VERSION = "0.1.0";
  const STORAGE_PREFIX = "axonos_ag0001_chronos_";
  const FIXED_DT = 1 / 60;
  const MAX_FRAME_DT = 0.075;
  const TARGET_ALTITUDE = 9000;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });

  const ui = {
    mode: document.getElementById("modeLabel"),
    altitude: document.getElementById("altitudeLabel"),
    hash: document.getElementById("hashLabel"),
    metrics: document.getElementById("metrics"),
    threat: document.getElementById("threatLabel"),
    threatHint: document.getElementById("threatHint"),
    eventLog: document.getElementById("eventLog"),
    grade: document.getElementById("gradeLabel"),
    runState: document.getElementById("runStateLabel"),
    score: document.getElementById("scoreLabel"),
    intent: document.getElementById("intentLabel"),
    release: document.getElementById("releaseLabel"),
    intro: document.getElementById("introCard"),
    scenario: document.getElementById("scenario"),
    start: document.getElementById("startBtn"),
    pause: document.getElementById("pauseBtn"),
    reset: document.getElementById("resetBtn"),
    mute: document.getElementById("muteBtn"),
    introStart: document.getElementById("introStart"),
    touchLeft: document.getElementById("touchLeft"),
    touchRight: document.getElementById("touchRight"),
    touchBoost: document.getElementById("touchBoost"),
    touchShield: document.getElementById("touchShield")
  };

  const metricSpec = [
    ["boundary", "Boundary Integrity", "safe"],
    ["vault", "Privacy Vault", "safe"],
    ["consent", "Consent Coherence", "safe"],
    ["flow", "Cognitive Flow", "safe"],
    ["latency", "Latency Pressure", "danger"],
    ["rawRisk", "Raw Leak Risk", "danger"],
    ["stimRisk", "Stimulation Risk", "violet"]
  ];

  const scenarios = [
    {
      name: "Clean Boundary",
      seed: 11001,
      difficulty: 0.82,
      gap: 255,
      gateBias: 1.45,
      probeBias: 0.65,
      storm: 0.72,
      objective: "Onboarding route: learn steering, boost and typed-intent gates."
    },
    {
      name: "Raw Signal Storm",
      seed: 21017,
      difficulty: 1.08,
      gap: 230,
      gateBias: 1.0,
      probeBias: 0.92,
      storm: 1.2,
      objective: "Avoid red raw-signal shards. Keep Privacy Vault above 55."
    },
    {
      name: "Zero Trust Corridor",
      seed: 34031,
      difficulty: 1.18,
      gap: 222,
      gateBias: 0.92,
      probeBias: 1.45,
      storm: 1.05,
      objective: "Silver probes mimic safe packets. Never trust permission escalation."
    },
    {
      name: "Latency Spiral",
      seed: 48049,
      difficulty: 1.28,
      gap: 214,
      gateBias: 0.88,
      probeBias: 1.12,
      storm: 1.5,
      objective: "High speed, narrow lanes. Smooth input beats brute force."
    },
    {
      name: "Grand Sovereignty Trial",
      seed: 65063,
      difficulty: 1.45,
      gap: 204,
      gateBias: 0.75,
      probeBias: 1.65,
      storm: 1.75,
      objective: "Full AxonOS pressure: consent, vault, latency, typed intent."
    }
  ];

  const keys = new Set();
  const touch = { left: false, right: false, boost: false, shield: false, dragging: false, targetX: null };
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let audio = { enabled: false, ctx: null, gain: null, osc: null };
  let state = null;
  let lastTs = performance.now();
  let accumulator = 0;
  let resizeQueued = true;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function rng() {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fnv1a32(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  }

  function rectCircleHit(rx, ry, rw, rh, cx, cy, cr) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    return dist2(nx, ny, cx, cy) <= cr * cr;
  }

  function logEvent(msg) {
    if (!state) return;
    state.log.unshift(`[${Math.floor(state.time).toString().padStart(3, "0")}] ${msg}`);
    state.log.length = Math.min(state.log.length, 8);
  }

  function makeState() {
    const scenario = scenarios[Number(ui.scenario.value) || 0];
    const seed = scenario.seed + Math.floor(Date.now() / 600000) % 97;
    const rng = mulberry32(seed);
    const w = canvas.width / devicePixelRatio;
    const h = canvas.height / devicePixelRatio;
    return {
      version: VERSION,
      scenario,
      seed,
      rng,
      running: false,
      paused: false,
      terminal: false,
      outcome: "READY",
      time: 0,
      tick: 0,
      altitude: 0,
      speed: 385,
      score: 0,
      combo: 0,
      intentPackets: 0,
      rejectedRaw: 0,
      avoidedProbes: 0,
      shieldCharge: 100,
      boostHeat: 0,
      metrics: { boundary: 100, vault: 100, consent: 100, flow: 76, latency: 10, rawRisk: 5, stimRisk: 4 },
      craft: { x: w * 0.5, y: h * 0.74, vx: 0, vy: 0, roll: 0, radius: 21, trail: [] },
      obstacles: [],
      particles: [],
      rings: [],
      nextSpawnAltitude: 180,
      lastHash: "00000000",
      activeThreat: null,
      log: [],
      shake: 0,
      releaseAvailable: false,
      viewportW: w,
      viewportH: h
    };
  }

  function reset() {
    state = makeState();
    accumulator = 0;
    ui.intro.classList.remove("hidden");
    ui.intro.querySelector("h2").textContent = "Operate the Neural Boundary.";
    ui.intro.querySelector("p").textContent = "Chronos climbs like a precision aircraft through a hostile cognitive atmosphere. The engine is deterministic; the art is calm; the controls must feel exact. Your job is not to collect noise. Your job is to preserve sovereignty.";
    ui.intro.querySelector("button").textContent = "Launch Chronos";
    ui.pause.textContent = "Pause";
    logEvent("Chronos ready. Deterministic seed loaded.");
    updateUI(true);
  }

  function startRun() {
    if (!state) reset();
    if (state.terminal) reset();
    state.running = true;
    state.paused = false;
    ui.intro.classList.add("hidden");
    logEvent(`Launch: ${state.scenario.name}.`);
    startAudioIfNeeded();
  }

  function togglePause() {
    if (!state || !state.running || state.terminal) return;
    state.paused = !state.paused;
    ui.pause.textContent = state.paused ? "Resume" : "Pause";
    logEvent(state.paused ? "Run paused." : "Run resumed.");
  }

  function complete(outcome, reason) {
    if (!state || state.terminal) return;
    state.terminal = true;
    state.running = false;
    state.outcome = outcome;
    logEvent(reason);
    ui.intro.classList.remove("hidden");
    ui.intro.querySelector("h2").textContent = outcome === "SEALED" ? "Sovereignty Sealed." : `${outcome}.`;
    ui.intro.querySelector("p").textContent = buildReport(reason);
    const button = ui.intro.querySelector("button");
    button.textContent = "Run Again";
  }

  function buildReport(reason) {
    const m = state.metrics;
    const grade = state.outcome;
    const high = loadHighScore();
    if (state.score > high) saveHighScore(state.score);
    return `Grade ${grade}. Score ${Math.round(state.score)}. ${reason} Scenario: ${state.scenario.name}. Intent packets: ${state.intentPackets}. Boundary ${Math.round(m.boundary)}, Vault ${Math.round(m.vault)}, Consent ${Math.round(m.consent)}. State hash ${state.lastHash}.`;
  }

  function releaseAttempt() {
    if (!state || !state.running || state.paused || state.terminal) return;
    if (state.releaseAvailable) {
      const bonus = 600 + state.intentPackets * 35 + Math.floor(state.metrics.flow * 2);
      state.score += bonus;
      complete("SEALED", "Release accepted: typed intent stable, vault sealed, latency inside envelope.");
    } else {
      state.metrics.consent = clamp(state.metrics.consent - 4, 0, 100);
      state.metrics.latency = clamp(state.metrics.latency + 3, 0, 100);
      state.score -= 35;
      logEvent("Release rejected. Stabilize boundary metrics first.");
    }
  }

  function loadHighScore() {
    try { return Number(localStorage.getItem(STORAGE_PREFIX + "high_score") || 0); }
    catch (_) { return 0; }
  }
  function saveHighScore(score) {
    try { localStorage.setItem(STORAGE_PREFIX + "high_score", String(Math.round(score))); }
    catch (_) { /* localStorage unavailable */ }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(420, Math.floor(rect.width));
    const h = Math.max(560, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state) {
      const oldW = state.viewportW || w;
      const oldH = state.viewportH || h;
      state.craft.x = clamp(state.craft.x * (w / oldW), 44, w - 44);
      state.craft.y = h * 0.74;
      state.viewportW = w;
      state.viewportH = h;
    }
    resizeQueued = false;
  }

  function inputAxis() {
    let axis = 0;
    if (keys.has("ArrowLeft") || keys.has("KeyA") || touch.left) axis -= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD") || touch.right) axis += 1;
    if (touch.targetX !== null && state) {
      const dx = touch.targetX - state.craft.x;
      axis += clamp(dx / 120, -1, 1);
    }
    return clamp(axis, -1, 1);
  }

  function boostInput() { return keys.has("ArrowUp") || keys.has("KeyW") || touch.boost; }
  function shieldInput() { return keys.has("ArrowDown") || keys.has("KeyS") || touch.shield; }

  function update(dt) {
    if (!state || !state.running || state.paused || state.terminal) return;
    state.tick++;
    state.time += dt;

    const m = state.metrics;
    const craft = state.craft;
    const axis = inputAxis();
    const boosting = boostInput() && state.boostHeat < 92;
    const shielding = shieldInput() && state.shieldCharge > 0;
    const handling = shielding ? 1020 : 1350;
    const drag = shielding ? 0.90 : 0.945;

    craft.vx += axis * handling * dt;
    craft.vx *= Math.pow(drag, dt * 60);
    craft.vx = clamp(craft.vx, -620, 620);
    craft.x += craft.vx * dt;

    if (craft.x < 32) { craft.x = 32; craft.vx *= -0.18; m.boundary -= 0.18; }
    if (craft.x > state.viewportW - 32) { craft.x = state.viewportW - 32; craft.vx *= -0.18; m.boundary -= 0.18; }

    const targetRoll = clamp(craft.vx / 560, -1, 1) * 0.55;
    craft.roll = lerp(craft.roll, targetRoll, 0.15);

    if (boosting) {
      state.speed = lerp(state.speed, 560 + state.scenario.difficulty * 60, 0.025);
      state.boostHeat = clamp(state.boostHeat + 34 * dt, 0, 100);
      m.flow = clamp(m.flow + 0.014, 0, 100);
      m.latency = clamp(m.latency + 0.018 * state.scenario.difficulty, 0, 100);
    } else {
      state.speed = lerp(state.speed, 390 + state.scenario.difficulty * 28, 0.018);
      state.boostHeat = clamp(state.boostHeat - 24 * dt, 0, 100);
    }

    if (shielding) {
      state.shieldCharge = clamp(state.shieldCharge - 28 * dt, 0, 100);
      state.speed = lerp(state.speed, 335, 0.04);
      m.latency = clamp(m.latency + 0.012, 0, 100);
    } else {
      state.shieldCharge = clamp(state.shieldCharge + 12 * dt, 0, 100);
    }

    const ascent = state.speed * dt;
    state.altitude += ascent;

    spawnWorld();
    updateWorld(dt, ascent, shielding);
    updateParticles(dt, ascent, boosting, shielding);
    updateMetrics(dt, boosting, shielding);
    updateHash();
    updateAudio();

    if (state.altitude >= TARGET_ALTITUDE && state.releaseAvailable) {
      complete("SEALED", "Target altitude reached with stable sovereignty envelope.");
    }

    if (m.boundary <= 0) complete("BREACHED", "Boundary collapse: repeated impacts broke the neural perimeter.");
    else if (m.rawRisk >= 100) complete("BREACHED", "Raw leak limit reached. Avoid red shards or brake with shield earlier.");
    else if (m.stimRisk >= 100) complete("UNSAFE", "Unsafe stimulation pressure escaped the envelope.");
    else if (m.vault <= 0) complete("BREACHED", "Privacy Vault failed under raw-signal pressure.");
  }

  function spawnWorld() {
    const s = state.scenario;
    while (state.altitude + 1800 > state.nextSpawnAltitude) {
      const a = state.nextSpawnAltitude;
      const laneCount = 4 + Math.floor(s.difficulty * 1.5);
      const laneW = state.viewportW / laneCount;
      const gapLane = Math.floor(state.rng() * laneCount);
      const y = -((a - state.altitude) * 0.75 + 140);
      const typeRoll = state.rng();

      if (typeRoll < 0.34 * s.gateBias) {
        state.obstacles.push(makeGate(gapLane * laneW + laneW * 0.5, y, laneW * 0.82));
      } else if (typeRoll < 0.62) {
        for (let i = 0; i < laneCount; i++) {
          if (Math.abs(i - gapLane) <= (state.rng() < 0.22 ? 1 : 0)) continue;
          state.obstacles.push(makeShard(i * laneW + laneW * (0.25 + state.rng() * 0.5), y + state.rng() * 90, s));
        }
      } else if (typeRoll < 0.82) {
        state.obstacles.push(makeWave(y, s));
      } else {
        state.obstacles.push(makeProbe((0.18 + state.rng() * 0.64) * state.viewportW, y, s));
      }

      if (state.rng() < 0.18 * s.storm) {
        state.obstacles.push(makeLatencyField(y - 80, s));
      }

      state.nextSpawnAltitude += s.gap + state.rng() * 95;
    }
  }

  function makeGate(x, y, width) {
    return { kind: "gate", x, y, w: clamp(width, 110, 240), h: 58, r: 28, passed: false, label: "TYPED INTENT" };
  }

  function makeShard(x, y, s) {
    const r = 20 + state.rng() * 18 * s.difficulty;
    return { kind: "raw", x, y, r, spin: state.rng() * Math.PI, vx: (state.rng() - 0.5) * 28 * s.storm, label: "RAW LEAK" };
  }

  function makeWave(y, s) {
    return { kind: "stim", x: 0, y, w: state.viewportW, h: 24 + 14 * s.difficulty, phase: state.rng() * 6.28, amp: 36 + s.difficulty * 18, label: "UNSAFE STIM" };
  }

  function makeProbe(x, y, s) {
    return { kind: "probe", x, y, r: 24 + s.difficulty * 8, vx: (state.rng() < 0.5 ? -1 : 1) * (40 + 60 * s.probeBias), phase: state.rng() * 6.28, label: "ZERO TRUST" };
  }

  function makeLatencyField(y, s) {
    const side = state.rng() < 0.5 ? 0 : 1;
    return { kind: "latency", x: side ? state.viewportW * 0.66 : 0, y, w: state.viewportW * 0.34, h: 170 + 60 * s.difficulty, label: "LATENCY" };
  }

  function updateWorld(dt, ascent, shielding) {
    const c = state.craft;
    state.activeThreat = null;

    for (const o of state.obstacles) {
      o.y += ascent * 0.75;
      if (o.vx) o.x += o.vx * dt;
      if (o.kind === "probe") {
        o.phase += dt * 4;
        if (o.x < 40 || o.x > state.viewportW - 40) o.vx *= -1;
      }
      if (o.kind === "raw") {
        o.spin += dt * 2.2;
        o.x += o.vx * dt;
      }
      if (o.kind === "stim") o.phase += dt * 4.4;

      const near = Math.abs(o.y - c.y) < 170;
      if (near && !state.activeThreat) state.activeThreat = o;

      if (o.kind === "gate") {
        const hit = rectCircleHit(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, c.x, c.y, c.radius);
        if (hit && !o.passed) {
          o.passed = true;
          state.intentPackets += 1;
          state.combo += 1;
          state.score += 130 + state.combo * 18;
          state.metrics.consent = clamp(state.metrics.consent + 2.6, 0, 100);
          state.metrics.flow = clamp(state.metrics.flow + 3.2, 0, 100);
          state.metrics.rawRisk = clamp(state.metrics.rawRisk - 1.8, 0, 100);
          emitParticles(c.x, c.y, 16, "gate");
          logEvent("Typed intent accepted. Raw signal remains sealed.");
        }
      } else if (o.kind === "raw") {
        if (dist2(o.x, o.y, c.x, c.y) < (o.r + c.radius) ** 2) {
          if (shielding) {
            state.metrics.vault = clamp(state.metrics.vault - 2.6, 0, 100);
            state.metrics.rawRisk = clamp(state.metrics.rawRisk + 1.8, 0, 100);
            state.score -= 14;
            o.y = state.viewportH + 200;
            emitParticles(o.x, o.y, 10, "shield");
            logEvent("Vault shield absorbed raw-signal shard.");
          } else {
            hitDamage(9, 10, 0, "Raw signal exposure hit.");
            o.y = state.viewportH + 200;
          }
        }
      } else if (o.kind === "stim") {
        const waveY = o.y + Math.sin((c.x / state.viewportW) * Math.PI * 2 + o.phase) * o.amp;
        if (Math.abs(c.y - waveY) < c.radius + o.h) {
          if (shielding) {
            state.metrics.stimRisk = clamp(state.metrics.stimRisk + 0.28, 0, 100);
            state.metrics.latency = clamp(state.metrics.latency + 0.18, 0, 100);
          } else {
            hitDamage(5, 0, 8, "Unsafe stimulation waveform contact.");
          }
        }
      } else if (o.kind === "probe") {
        if (dist2(o.x, o.y, c.x, c.y) < (o.r + c.radius) ** 2) {
          if (shielding) {
            state.avoidedProbes += 1;
            state.metrics.consent = clamp(state.metrics.consent + 0.8, 0, 100);
            state.metrics.latency = clamp(state.metrics.latency + 0.7, 0, 100);
            state.score += 20;
            o.y = state.viewportH + 200;
            logEvent("Zero Trust probe rejected by shield envelope.");
          } else {
            hitDamage(5, 3, 2, "Permission probe bypassed consent gate.");
            state.metrics.consent = clamp(state.metrics.consent - 8, 0, 100);
            o.y = state.viewportH + 200;
          }
        }
      } else if (o.kind === "latency") {
        if (rectCircleHit(o.x, o.y, o.w, o.h, c.x, c.y, c.radius)) {
          state.metrics.latency = clamp(state.metrics.latency + (shielding ? 0.15 : 0.55), 0, 100);
          state.speed = lerp(state.speed, 280, 0.05);
        }
      }
    }

    const before = state.obstacles.length;
    state.obstacles = state.obstacles.filter(o => o.y < state.viewportH + 240);
    const cleared = before - state.obstacles.length;
    if (cleared > 0) state.score += cleared * 2;
  }

  function hitDamage(boundary, raw, stim, msg) {
    state.metrics.boundary = clamp(state.metrics.boundary - boundary, 0, 100);
    state.metrics.vault = clamp(state.metrics.vault - raw * 0.48, 0, 100);
    state.metrics.rawRisk = clamp(state.metrics.rawRisk + raw, 0, 100);
    state.metrics.stimRisk = clamp(state.metrics.stimRisk + stim, 0, 100);
    state.metrics.latency = clamp(state.metrics.latency + 2.2, 0, 100);
    state.combo = 0;
    state.score -= 85;
    state.shake = Math.max(state.shake, 12);
    emitParticles(state.craft.x, state.craft.y, 20, "hit");
    logEvent(msg);
  }

  function emitParticles(x, y, n, kind) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const a = state.rng() * Math.PI * 2;
      const v = 25 + state.rng() * 170;
      state.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.35 + state.rng() * 0.5, max: 0.8, kind });
    }
  }

  function updateParticles(dt, ascent, boosting, shielding) {
    const c = state.craft;
    c.trail.unshift({ x: c.x, y: c.y + 24, life: boosting ? 1 : 0.55, shield: shielding });
    c.trail.length = Math.min(c.trail.length, reduceMotion ? 8 : 28);
    for (const t of c.trail) {
      t.y += ascent * 0.18;
      t.life -= dt * 1.7;
    }
    c.trail = c.trail.filter(t => t.life > 0);

    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += (p.vy + ascent * 0.3) * dt;
      p.vx *= Math.pow(0.9, dt * 60);
      p.vy *= Math.pow(0.9, dt * 60);
      p.life -= dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);
    state.shake = Math.max(0, state.shake - dt * 34);
  }

  function updateMetrics(dt, boosting, shielding) {
    const m = state.metrics;
    const s = state.scenario;
    m.boundary = clamp(m.boundary + 0.32 * dt - m.rawRisk * 0.0022 * dt - m.stimRisk * 0.002 * dt, 0, 100);
    m.vault = clamp(m.vault + (shielding ? -0.08 : 0.34) * dt - m.rawRisk * 0.0015 * dt, 0, 100);
    m.consent = clamp(m.consent + 0.18 * dt - s.probeBias * 0.03 * dt, 0, 100);
    m.flow = clamp(m.flow + (boosting ? 0.22 : -0.018) * dt - m.latency * 0.002 * dt, 0, 100);
    m.latency = clamp(m.latency - (shielding ? 0.26 : 0.42) * dt + s.difficulty * 0.018 * dt, 0, 100);
    m.rawRisk = clamp(m.rawRisk - (shielding ? 0.2 : 0.08) * dt + (100 - m.vault) * 0.0005 * dt, 0, 100);
    m.stimRisk = clamp(m.stimRisk - 0.09 * dt + s.storm * 0.015 * dt, 0, 100);

    state.releaseAvailable = state.altitude >= TARGET_ALTITUDE * 0.72 &&
      m.boundary >= 70 && m.vault >= 64 && m.consent >= 64 &&
      m.rawRisk <= 36 && m.stimRisk <= 36 && m.latency <= 72;

    const survival = dt * (1 + state.altitude / 1800);
    state.score += survival * 2.4;
    if (state.releaseAvailable) state.score += dt * 4;
  }

  function updateHash() {
    const m = state.metrics;
    const payload = [
      VERSION, state.seed, state.tick, Math.floor(state.altitude), Math.floor(state.score),
      state.intentPackets, Math.round(m.boundary), Math.round(m.vault), Math.round(m.consent),
      Math.round(m.rawRisk), Math.round(m.stimRisk), Math.round(m.latency)
    ].join("|");
    state.lastHash = fnv1a32(payload).toString(16).padStart(8, "0").toUpperCase();
  }

  function draw() {
    if (resizeQueued) resize();
    if (!state) reset();
    const w = state.viewportW;
    const h = state.viewportH;
    const shakeX = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = state.shake ? (Math.random() - 0.5) * state.shake : 0;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050608";
    ctx.fillRect(0, 0, w, h);
    ctx.translate(shakeX, shakeY);
    drawBackground(w, h);
    drawObstacles();
    drawParticles();
    drawCraft();
    drawHudOverlay(w, h);
    ctx.restore();
  }

  function drawBackground(w, h) {
    const alt = state.altitude;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#071017");
    gradient.addColorStop(0.5, "#090b0f");
    gradient.addColorStop(1, "#040507");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.strokeStyle = "rgba(216,222,231,0.16)";
    ctx.lineWidth = 1;
    const grid = 54;
    const offset = (alt * 0.22) % grid;
    for (let y = -grid + offset; y < h + grid; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let x = 0; x <= w; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + Math.sin(alt * 0.001) * 20, h); ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    const cx = w * 0.5, cy = h * 0.76;
    const pulse = reduceMotion ? 0 : Math.sin(state.time * 1.2) * 4;
    ctx.strokeStyle = `rgba(200,169,106,${0.13 + state.metrics.boundary / 900})`;
    ctx.lineWidth = 2;
    for (let r = 150; r < Math.max(w, h); r += 110) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawObstacles() {
    for (const o of state.obstacles) {
      if (o.kind === "gate") drawGate(o);
      else if (o.kind === "raw") drawRaw(o);
      else if (o.kind === "stim") drawStim(o);
      else if (o.kind === "probe") drawProbe(o);
      else if (o.kind === "latency") drawLatency(o);
    }
  }

  function drawGate(o) {
    ctx.save();
    const alpha = o.passed ? 0.25 : 0.95;
    ctx.globalAlpha = alpha;
    ctx.translate(o.x, o.y);
    ctx.strokeStyle = "rgba(131,217,181,0.82)";
    ctx.fillStyle = "rgba(131,217,181,0.075)";
    roundRect(-o.w / 2, -o.h / 2, o.w, o.h, 22, true, true);
    ctx.strokeStyle = "rgba(200,169,106,0.8)";
    ctx.beginPath();
    ctx.moveTo(-o.w / 2 + 22, 0);
    ctx.lineTo(o.w / 2 - 22, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(238,242,246,0.78)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(o.label, 0, 4);
    ctx.restore();
  }

  function drawRaw(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.spin);
    ctx.strokeStyle = "rgba(229,111,111,0.9)";
    ctx.fillStyle = "rgba(229,111,111,0.14)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const r = i % 2 ? o.r * 0.46 : o.r;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawStim(o) {
    ctx.save();
    ctx.strokeStyle = "rgba(200,92,255,0.74)";
    ctx.lineWidth = o.h;
    ctx.lineCap = "round";
    ctx.beginPath();
    const step = Math.max(10, state.viewportW / 48);
    for (let x = -20; x <= state.viewportW + 20; x += step) {
      const y = o.y + Math.sin((x / state.viewportW) * Math.PI * 2 + o.phase) * o.amp;
      if (x <= -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(238,242,246,0.22)";
    ctx.stroke();
    ctx.restore();
  }

  function drawProbe(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    const r = o.r + Math.sin(o.phase) * 5;
    ctx.strokeStyle = "rgba(216,222,231,0.82)";
    ctx.fillStyle = "rgba(216,222,231,0.06)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.rotate(o.phase * 0.5);
    ctx.beginPath();
    ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
    ctx.moveTo(0, -r); ctx.lineTo(0, r);
    ctx.stroke();
    ctx.restore();
  }

  function drawLatency(o) {
    ctx.save();
    ctx.fillStyle = "rgba(232,193,106,0.08)";
    ctx.strokeStyle = "rgba(232,193,106,0.32)";
    roundRect(o.x, o.y, o.w, o.h, 18, true, true);
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = "rgba(232,193,106,0.72)";
    ctx.fillText("LATENCY FIELD", o.x + 14, o.y + 24);
    ctx.restore();
  }

  function drawParticles() {
    for (const t of state.craft.trail) {
      ctx.save();
      ctx.globalAlpha = clamp(t.life, 0, 1) * 0.58;
      ctx.fillStyle = t.shield ? "rgba(216,222,231,0.78)" : "rgba(200,169,106,0.76)";
      ctx.beginPath();
      ctx.ellipse(t.x, t.y, 5 + t.life * 12, 12 + t.life * 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const p of state.particles) {
      ctx.save();
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.kind === "hit" ? "rgba(229,111,111,0.9)" : p.kind === "gate" ? "rgba(131,217,181,0.9)" : "rgba(216,222,231,0.8)";
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function drawCraft() {
    const c = state.craft;
    const shielding = shieldInput() && state.shieldCharge > 0;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.roll);
    if (shielding) {
      ctx.strokeStyle = "rgba(216,222,231,0.46)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 40 + Math.sin(state.time * 5) * 2, 0, Math.PI * 2); ctx.stroke();
    }
    const body = ctx.createLinearGradient(0, -42, 0, 42);
    body.addColorStop(0, "#eef2f6");
    body.addColorStop(0.45, "#8f9baa");
    body.addColorStop(1, "#262c35");
    ctx.fillStyle = body;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(22, 25);
    ctx.lineTo(0, 14);
    ctx.lineTo(-22, 25);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(200,169,106,0.72)";
    ctx.beginPath(); ctx.ellipse(0, -8, 6, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawHudOverlay(w, h) {
    ctx.save();
    const progress = clamp(state.altitude / TARGET_ALTITUDE, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(w - 22, 22, 6, h - 44, 3, true, false);
    ctx.fillStyle = state.releaseAvailable ? "rgba(131,217,181,0.82)" : "rgba(200,169,106,0.74)";
    roundRect(w - 22, 22 + (h - 44) * (1 - progress), 6, (h - 44) * progress, 3, true, false);

    ctx.font = "12px ui-monospace, monospace";
    ctx.fillStyle = "rgba(238,242,246,0.68)";
    ctx.fillText(`seed:${state.seed}`, 18, 26);
    ctx.fillText(`high:${loadHighScore()}`, 18, 44);
    if (state.releaseAvailable) {
      ctx.fillStyle = "rgba(131,217,181,0.86)";
      ctx.fillText("RELEASE WINDOW OPEN", 18, 66);
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r, fill, stroke) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function updateUI(force = false) {
    if (!state) return;
    const m = state.metrics;
    ui.mode.textContent = state.running ? (state.paused ? "PAUSED" : "FLIGHT") : state.terminal ? "DONE" : "STANDBY";
    ui.altitude.textContent = `${Math.floor(state.altitude).toLocaleString()} m`;
    ui.hash.textContent = state.lastHash;
    ui.grade.textContent = state.outcome;
    ui.runState.textContent = state.running ? (state.paused ? "paused" : "running") : state.terminal ? "complete" : "standby";
    ui.score.textContent = Math.round(state.score).toLocaleString();
    ui.intent.textContent = String(state.intentPackets);
    ui.release.textContent = state.releaseAvailable ? "open" : "locked";

    if (!ui.metrics.dataset.ready || force) {
      ui.metrics.innerHTML = "";
      for (const [key, label, tone] of metricSpec) {
        const el = document.createElement("div");
        const labelNode = document.createElement("label");
        const row = document.createElement("div");
        const bar = document.createElement("div");
        const fill = document.createElement("i");
        const value = document.createElement("b");
        el.className = `metric ${tone}`;
        el.dataset.metric = key;
        labelNode.textContent = label;
        row.className = "metric-row";
        bar.className = "bar";
        bar.appendChild(fill);
        row.appendChild(bar);
        row.appendChild(value);
        el.appendChild(labelNode);
        el.appendChild(row);
        ui.metrics.appendChild(el);
      }
      ui.metrics.dataset.ready = "1";
    }
    for (const [key] of metricSpec) {
      const el = ui.metrics.querySelector(`[data-metric="${key}"]`);
      const value = Math.round(m[key]);
      el.querySelector("i").style.width = `${value}%`;
      el.querySelector("b").textContent = String(value).padStart(3, "0");
    }

    if (state.activeThreat) {
      ui.threat.textContent = state.activeThreat.label;
      ui.threatHint.textContent = threatHint(state.activeThreat);
    } else if (state.releaseAvailable) {
      ui.threat.textContent = "Release window open";
      ui.threatHint.textContent = "Press Enter when ready, or keep climbing for a stronger score.";
    } else {
      ui.threat.textContent = "No unresolved event";
      ui.threatHint.textContent = "Maintain smooth flight and preserve the consent/vault envelope.";
    }

    ui.eventLog.replaceChildren(...state.log.map(line => {
      const d = document.createElement("div");
      d.textContent = line;
      return d;
    }));
  }

  function threatHint(o) {
    if (o.kind === "gate") return "Pass through the center: typed intent can cross the boundary.";
    if (o.kind === "raw") return "Dodge. Shield only as emergency brake: raw signal must not leak.";
    if (o.kind === "stim") return "Avoid the violet waveform or brake with shield to keep stimulation risk bounded.";
    if (o.kind === "probe") return "Zero Trust probe. Shield or dodge; do not let it touch the craft.";
    if (o.kind === "latency") return "Latency field. Smooth steering reduces pressure; boosting makes it worse.";
    return "Unknown event. Audit by movement, then avoid.";
  }

  function startAudioIfNeeded() {
    if (!audio.enabled || audio.ctx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audio.ctx = new Ctx();
      audio.gain = audio.ctx.createGain();
      audio.gain.gain.value = 0.035;
      audio.osc = audio.ctx.createOscillator();
      audio.osc.type = "sine";
      audio.osc.frequency.value = 88;
      audio.osc.connect(audio.gain);
      audio.gain.connect(audio.ctx.destination);
      audio.osc.start();
    } catch (_) { audio.enabled = false; }
  }

  function updateAudio() {
    if (!audio.ctx || !state) return;
    const boost = boostInput() ? 1 : 0;
    const target = 78 + state.speed * 0.12 + boost * 40 + state.metrics.latency * 0.4;
    audio.osc.frequency.setTargetAtTime(target, audio.ctx.currentTime, 0.04);
    audio.gain.gain.setTargetAtTime(state.running && !state.paused ? 0.035 : 0.008, audio.ctx.currentTime, 0.08);
  }

  function frame(ts) {
    const dt = Math.min(MAX_FRAME_DT, (ts - lastTs) / 1000 || 0);
    lastTs = ts;
    accumulator += dt;
    while (accumulator >= FIXED_DT) {
      update(FIXED_DT);
      accumulator -= FIXED_DT;
    }
    draw();
    updateUI();
    requestAnimationFrame(frame);
  }

  function bindButtonHold(button, prop) {
    const on = (event) => { event.preventDefault(); touch[prop] = true; };
    const off = (event) => { event.preventDefault(); touch[prop] = false; };
    button.addEventListener("pointerdown", on);
    button.addEventListener("pointerup", off);
    button.addEventListener("pointercancel", off);
    button.addEventListener("pointerleave", off);
  }

  window.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
    if (e.code === "Space") togglePause();
    else if (e.code === "Enter") releaseAttempt();
    else keys.add(e.code);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("resize", () => { resizeQueued = true; });

  canvas.addEventListener("pointerdown", (e) => {
    touch.dragging = true;
    const rect = canvas.getBoundingClientRect();
    touch.targetX = e.clientX - rect.left;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!touch.dragging) return;
    const rect = canvas.getBoundingClientRect();
    touch.targetX = e.clientX - rect.left;
  });
  canvas.addEventListener("pointerup", () => { touch.dragging = false; touch.targetX = null; });
  canvas.addEventListener("pointercancel", () => { touch.dragging = false; touch.targetX = null; });

  ui.start.addEventListener("click", startRun);
  ui.introStart.addEventListener("click", startRun);
  ui.pause.addEventListener("click", togglePause);
  ui.reset.addEventListener("click", reset);
  ui.scenario.addEventListener("change", reset);
  ui.mute.addEventListener("click", () => {
    audio.enabled = !audio.enabled;
    ui.mute.textContent = audio.enabled ? "Audio On" : "Audio Off";
    ui.mute.setAttribute("aria-pressed", String(audio.enabled));
    if (!audio.enabled && audio.gain) audio.gain.gain.value = 0;
    if (audio.enabled) startAudioIfNeeded();
  });

  bindButtonHold(ui.touchLeft, "left");
  bindButtonHold(ui.touchRight, "right");
  bindButtonHold(ui.touchBoost, "boost");
  bindButtonHold(ui.touchShield, "shield");

  reset();
  requestAnimationFrame(frame);
})();
