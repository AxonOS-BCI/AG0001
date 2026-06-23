/* no-telemetry
   AxonOS AG0001 — Chronos Boundary Flight v3.1
   Static browser runtime. No analytics, no network calls, no telemetry.
*/
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const canvas = $('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const mapCanvas = $('map');
  const mapCtx = mapCanvas ? mapCanvas.getContext('2d') : null;

  const el = {
    alt: $('alt'),
    score: $('score'),
    combo: $('combo'),
    msg: $('msg'),
    float: $('float'),
    menu: $('menu'),
    cfg: $('cfg'),
    over: $('over'),
    win: $('win'),
    stBest: $('stBest'),
    stRuns: $('stRuns'),
    stTotal: $('stTotal'),
    stWins: $('stWins'),
    dlabel: $('dlabel'),
    b1: $('b1'),
    b2: $('b2'),
    b3: $('b3'),
    b4: $('b4'),
    shield: $('shield'),
    boost: $('boost'),
    scd: $('scd'),
    bcd: $('bcd'),
    ea: $('ea'),
    es: $('es'),
    ec: $('ec'),
    er: $('er'),
    wa: $('wa'),
    ws: $('ws')
  };

  const CONFIG = {
    targetAltitude: 9000,
    baseSpeed: 1.55,
    maxSpeed: 4.35,
    boostSpeed: 3.75,
    shieldTime: 126,
    shieldCooldown: 300,
    spawnBase: 54,
    diff: { easy: 0.72, normal: 1, hard: 1.38 }
  };

  const LOADOUTS = {
    balanced: { shields: 3, boost: 1.00, score: 1.00, hp: 1.00, speed: 1.00 },
    speed:    { shields: 2, boost: 1.25, score: 1.05, hp: 0.90, speed: 1.06 },
    tank:     { shields: 4, boost: 0.90, score: 0.95, hp: 1.18, speed: 0.92 },
    score:    { shields: 2, boost: 1.00, score: 2.00, hp: 0.72, speed: 1.00 }
  };

  let W = 1;
  let H = 1;
  let DPR = 1;

  let mode = 'menu';
  let frame = 0;
  let altitude = 0;
  let score = 0;
  let speed = 1;
  let zone = 0;
  let combo = 0;
  let maxCombo = 0;
  let comboTimer = 0;
  let shake = 0;
  let selectedLoadout = 'balanced';

  const settings = loadJSON('ag0001_settings_v31', {
    sfx: true,
    music: true,
    shake: true,
    difficulty: 'normal'
  });

  const stats = loadJSON('ag0001_stats_v31', {
    best: 0,
    runs: 0,
    total: 0,
    wins: 0
  });

  const input = {
    left: false,
    right: false,
    boost: false,
    shield: false,
    pointer: false,
    pointerX: 0
  };

  const player = {
    x: 0,
    y: 0,
    vx: 0,
    bank: 0,
    radius: 17,
    shields: 3,
    shieldMax: 3,
    shieldActive: false,
    shieldTimer: 0,
    shieldCooldown: 0,
    fuel: 100,
    hp: [100, 100, 100, 100],
    grace: 0,
    trail: []
  };

  const stars = [];
  const obstacles = [];
  const gates = [];
  const gems = [];
  const particles = [];

  let audioCtx = null;
  let musicTimer = null;

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
    } catch (_) {
      return { ...fallback };
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function initAudio() {
    if (audioCtx) return;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) throw new Error('AudioContext unavailable');
      audioCtx = new AudioCtor();
    } catch (_) {
      settings.sfx = false;
      settings.music = false;
    }
  }

  function resumeAudio() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function tone(freq, type = 'sine', duration = 0.1, volume = 0.04, slideTo = 0) {
    if (!settings.sfx) return;
    resumeAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideTo > 0) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function setMusic(on) {
    if (!on && musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
      return;
    }

    if (!on || musicTimer || !settings.music) return;

    resumeAudio();

    const scale = [110, 146.83, 164.81, 220, 261.63, 329.63, 392];
    let i = 0;

    musicTimer = setInterval(() => {
      if (mode !== 'play' || !settings.music) return;
      const base = scale[i % scale.length] * (1 + zone * 0.06);
      tone(base, 'sine', 0.24, 0.018, base * 1.5);
      i += 1;
    }, 430);
  }

  function resize() {
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = Math.max(1, window.innerWidth);
    H = Math.max(1, window.innerHeight);

    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (!player.x) player.x = W / 2;
    player.y = H * 0.78;

    stars.length = 0;
    for (let i = 0; i < 125; i += 1) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: rand(0.25, 1.2),
        alpha: rand(0.18, 0.8)
      });
    }
  }

  function showScreen(name) {
    mode = name;

    el.menu.classList.toggle('hidden', name !== 'menu');
    el.cfg.classList.toggle('hidden', name !== 'cfg');
    el.over.classList.toggle('hidden', name !== 'over');
    el.win.classList.toggle('hidden', name !== 'win');

    if (name !== 'play') setMusic(false);
  }

  function updateStatsUI() {
    el.stBest.textContent = `${Math.floor(stats.best)} m`;
    el.stRuns.textContent = String(stats.runs);
    el.stTotal.textContent = String(Math.floor(stats.total));
    el.stWins.textContent = String(stats.wins);
    el.dlabel.textContent = settings.difficulty.toUpperCase();

    $('tsfx').classList.toggle('on', settings.sfx);
    $('tmus').classList.toggle('on', settings.music);
    $('tsha').classList.toggle('on', settings.shake);
  }

  function startRun() {
    const loadout = LOADOUTS[selectedLoadout] || LOADOUTS.balanced;

    frame = 0;
    altitude = 0;
    score = 0;
    speed = CONFIG.baseSpeed * loadout.speed;
    zone = 0;
    combo = 0;
    maxCombo = 0;
    comboTimer = 0;
    shake = 0;

    player.x = W / 2;
    player.y = H * 0.78;
    player.vx = 0;
    player.bank = 0;
    player.shields = loadout.shields;
    player.shieldMax = loadout.shields;
    player.shieldActive = false;
    player.shieldTimer = 0;
    player.shieldCooldown = 0;
    player.fuel = 100;
    player.hp = [100 * loadout.hp, 100 * loadout.hp, 100 * loadout.hp, 100 * loadout.hp];
    player.grace = 0;
    player.trail.length = 0;

    obstacles.length = 0;
    gates.length = 0;
    gems.length = 0;
    particles.length = 0;

    stats.runs += 1;
    saveJSON('ag0001_stats_v31', stats);

    message('BOUNDARY LINK');
    showScreen('play');
    setMusic(true);
  }

  function message(text) {
    el.msg.textContent = text;
    el.msg.classList.add('show');
    setTimeout(() => el.msg.classList.remove('show'), 850);
  }

  function floatingText(x, y, text, color) {
    const node = document.createElement('div');
    node.className = 'ft';
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.color = color;
    el.float.appendChild(node);
    setTimeout(() => node.remove(), 1150);
  }

  function spawnObstacle() {
    const mult = CONFIG.diff[settings.difficulty] || 1;
    const size = rand(30, 64) + zone * 2;
    const type = pick(['boundary', 'privacy', 'consent', 'latency']);
    const colors = {
      boundary: '#ff3366',
      privacy: '#a020f0',
      consent: '#ffb000',
      latency: '#00a0ff'
    };

    obstacles.push({
      type,
      x: rand(35, W - 35),
      y: -80,
      w: size * rand(1.0, 1.8),
      h: size * rand(0.7, 1.1),
      vy: rand(1.7, 2.9) * mult + zone * 0.18,
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.035, 0.035),
      color: colors[type]
    });
  }

  function spawnGate() {
    const good = Math.random() > 0.3;

    gates.push({
      x: rand(W * 0.18, W * 0.82),
      y: -55,
      w: rand(98, 150),
      h: 38,
      good,
      label: good ? pick(['CONSENT', 'PRIVACY', 'BOUNDARY']) : pick(['RAW', 'LEAK', 'DRIFT']),
      vy: 2.1 + zone * 0.12
    });
  }

  function spawnGem() {
    gems.push({
      x: rand(25, W - 25),
      y: -25,
      radius: rand(5, 9),
      vy: rand(2.2, 3.3) + zone * 0.1,
      angle: 0,
      value: 100 + zone * 25
    });
  }

  function emit(x, y, color, count = 14, power = 1) {
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x,
        y,
        vx: rand(-2.2, 2.2) * power,
        vy: rand(-2.2, 2.2) * power,
        radius: rand(1.4, 3.2),
        life: rand(28, 50),
        max: 50,
        color
      });
    }
  }

  function activateShield() {
    if (player.shields <= 0 || player.shieldCooldown > 0 || player.shieldActive) return;

    player.shields -= 1;
    player.shieldActive = true;
    player.shieldTimer = CONFIG.shieldTime;
    player.shieldCooldown = CONFIG.shieldCooldown;

    message('SHIELD');
    tone(260, 'sine', 0.22, 0.06, 640);
  }

  function damage(type, amount) {
    if (player.grace > 0) return;

    if (player.shieldActive) {
      emit(player.x, player.y, '#00c8ff', 14, 1.4);
      tone(620, 'triangle', 0.12, 0.05, 980);
      player.grace = 16;
      return;
    }

    const index = { boundary: 0, privacy: 1, consent: 2, latency: 3 }[type] ?? 0;
    player.hp[index] -= amount;
    player.grace = 42;
    shake = settings.shake ? 14 : 0;

    emit(player.x, player.y, '#ff3366', 24, 1.8);
    floatingText(player.x, player.y - 35, `-${Math.floor(amount)}`, '#ff3366');
    tone(120, 'sawtooth', 0.18, 0.07, 55);

    if (player.hp.some((v) => v <= 0)) endRun(false);
  }

  function addScore(value, x = player.x, y = player.y) {
    const loadout = LOADOUTS[selectedLoadout] || LOADOUTS.balanced;

    combo += 1;
    maxCombo = Math.max(maxCombo, combo);
    comboTimer = 128;

    const gained = Math.floor(value * loadout.score * (1 + combo * 0.035));
    score += gained;

    floatingText(x, y, `+${gained}`, '#ffd700');
    el.combo.textContent = `COMBO x${combo}`;
    el.combo.classList.add('on');

    tone(440 + combo * 16, 'square', 0.08, 0.025, 780 + combo * 22);
  }

  function addTrail(color) {
    player.trail.push({
      x: player.x,
      y: player.y + 16,
      life: 34,
      max: 34,
      color,
      radius: rand(2.5, 5.2)
    });

    if (player.trail.length > 55) player.trail.shift();
  }

  function updatePlaying() {
    frame += 1;
    zone = Math.floor(altitude / 1500);

    const loadout = LOADOUTS[selectedLoadout] || LOADOUTS.balanced;
    const diff = CONFIG.diff[settings.difficulty] || 1;
    const boosting = input.boost && player.fuel > 0;

    const desiredSpeed = boosting
      ? CONFIG.boostSpeed * loadout.boost
      : CONFIG.baseSpeed + zone * 0.18;

    speed += (clamp(desiredSpeed * loadout.speed, 0.9, CONFIG.maxSpeed * loadout.boost) - speed) * 0.035;

    if (boosting) {
      player.fuel = Math.max(0, player.fuel - 0.82);
      addTrail('#00f0c8');
    } else {
      player.fuel = Math.min(100, player.fuel + 0.24);
    }

    altitude += speed * (1.05 + zone * 0.018);
    score += Math.floor(speed * (1 + zone * 0.1));

    if (input.shield) {
      activateShield();
      input.shield = false;
    }

    const accel = 0.92 + zone * 0.025;
    if (input.left) player.vx -= accel;
    if (input.right) player.vx += accel;
    if (input.pointer) {
      player.vx += clamp((input.pointerX - player.x) * 0.018, -1.2, 1.2);
    }

    player.vx *= 0.87;
    player.x = clamp(player.x + player.vx, 22, W - 22);
    player.bank += (clamp(player.vx / 9, -0.72, 0.72) - player.bank) * 0.18;

    addTrail(player.shieldActive ? '#00c8ff' : '#c8a96a');

    const rate = Math.max(18, CONFIG.spawnBase - zone * 4 - Math.floor(frame / 1200) * 2);
    if (frame % Math.floor(rate / diff) === 0) spawnObstacle();
    if (frame % Math.floor(190 / diff) === 35) spawnGate();
    if (frame % Math.floor(70 / Math.max(0.7, diff)) === 14) spawnGem();

    updateEntities();
    updateTimers();
    updateHUD();

    if (altitude >= CONFIG.targetAltitude) endRun(true);
  }

  function updateEntities() {
    for (const star of stars) {
      star.y += speed * star.z * 0.72 + 0.35;
      if (star.y > H + 8) {
        star.y = -8;
        star.x = Math.random() * W;
      }
    }

    for (const o of obstacles) {
      o.y += o.vy + speed * 0.7;
      o.rot += o.spin;

      if (circleRect(player.x, player.y, player.radius, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h)) {
        damage(o.type, 22 + zone * 4);
        o.y = H + 200;
      }
    }

    for (const gate of gates) {
      gate.y += gate.vy + speed * 0.5;

      if (
        player.x > gate.x - gate.w / 2 &&
        player.x < gate.x + gate.w / 2 &&
        player.y > gate.y - gate.h / 2 &&
        player.y < gate.y + gate.h / 2
      ) {
        if (gate.good) {
          player.hp = player.hp.map((v) => Math.min(100, v + 8 + zone));
          addScore(350 + zone * 60, gate.x, gate.y);
          message(gate.label);
          emit(gate.x, gate.y, '#00f0c8', 20, 1.2);
        } else {
          damage('privacy', 30);
          message('DENIED');
          emit(gate.x, gate.y, '#ff3366', 20, 1.2);
        }
        gate.y = H + 200;
      }
    }

    for (const gem of gems) {
      gem.y += gem.vy + speed * 0.6;
      gem.angle += 0.1;

      const dx = player.x - gem.x;
      const dy = player.y - gem.y;
      if (dx * dx + dy * dy < (player.radius + gem.radius + 4) ** 2) {
        addScore(gem.value, gem.x, gem.y);
        player.fuel = Math.min(100, player.fuel + 12);
        emit(gem.x, gem.y, '#ffd700', 12, 1);
        gem.y = H + 200;
      }
    }

    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.life -= 1;
    }

    for (const trail of player.trail) {
      trail.life -= 1;
      trail.y += 1.4 + speed * 0.38;
    }

    cleanup();
  }

  function updateTimers() {
    if (player.grace > 0) player.grace -= 1;

    if (player.shieldActive) {
      player.shieldTimer -= 1;
      if (player.shieldTimer <= 0) player.shieldActive = false;
    }

    if (player.shieldCooldown > 0) player.shieldCooldown -= 1;

    if (comboTimer > 0) {
      comboTimer -= 1;
      if (comboTimer === 0) {
        combo = 0;
        el.combo.classList.remove('on');
      }
    }

    if (shake > 0) shake *= 0.86;
  }

  function cleanup() {
    removeOffscreen(obstacles, H + 200);
    removeOffscreen(gates, H + 200);
    removeOffscreen(gems, H + 200);

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }

    for (let i = player.trail.length - 1; i >= 0; i -= 1) {
      if (player.trail[i].life <= 0) player.trail.splice(i, 1);
    }
  }

  function removeOffscreen(list, limit) {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i].y > limit) list.splice(i, 1);
    }
  }

  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const x = clamp(cx, rx, rx + rw);
    const y = clamp(cy, ry, ry + rh);
    const dx = cx - x;
    const dy = cy - y;
    return dx * dx + dy * dy < r * r;
  }

  function endRun(won) {
    if (mode !== 'play') return;

    setMusic(false);

    stats.best = Math.max(stats.best, Math.floor(altitude));
    stats.total += Math.floor(score);
    if (won) stats.wins += 1;
    saveJSON('ag0001_stats_v31', stats);
    updateStatsUI();

    if (won) {
      el.wa.textContent = `${Math.floor(altitude)} m`;
      el.ws.textContent = String(Math.floor(score));
      tone(440, 'triangle', 0.4, 0.08, 880);
      showScreen('win');
      return;
    }

    el.ea.textContent = `${Math.floor(altitude)} m`;
    el.es.textContent = String(Math.floor(score));
    el.ec.textContent = `x${Math.max(1, maxCombo)}`;
    el.er.textContent =
      altitude > 7200 ? 'S' :
      altitude > 5400 ? 'A' :
      altitude > 3600 ? 'B' :
      altitude > 1800 ? 'C' : 'D';

    showScreen('over');
  }

  function updateHUD() {
    el.alt.textContent = `ALT ${Math.floor(altitude)} m`;
    el.score.textContent = String(Math.floor(score));

    updateBar(el.b1, player.hp[0]);
    updateBar(el.b2, player.hp[1]);
    updateBar(el.b3, player.hp[2]);
    updateBar(el.b4, player.hp[3]);

    el.shield.classList.toggle('active', player.shieldActive);
    el.shield.classList.toggle('cool', player.shieldCooldown > 0 && !player.shieldActive);
    el.boost.classList.toggle('active', input.boost && player.fuel > 0);
    el.boost.classList.toggle('cool', player.fuel < 14);

    el.scd.style.height = player.shieldCooldown > 0
      ? `${100 - (player.shieldCooldown / CONFIG.shieldCooldown) * 100}%`
      : '0%';

    el.bcd.style.height = `${100 - player.fuel}%`;
  }

  function updateBar(node, value) {
    const v = clamp(value, 0, 100);
    node.style.width = `${v}%`;
    node.style.background = v > 58 ? '#00f0c8' : (v > 28 ? '#ffd700' : '#ff3366');
  }

  function draw() {
    ctx.save();

    if (shake > 0 && settings.shake) {
      ctx.translate(rand(-shake, shake), rand(-shake, shake));
    }

    drawBackground();

    if (mode === 'play') {
      drawTrail();
      drawGates();
      drawObstacles();
      drawGems();
      drawPlayer();
      drawParticles();
      drawForeground();
      drawMinimap();
    } else {
      drawIdle();
    }

    ctx.restore();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#07111d');
    g.addColorStop(0.46, '#050508');
    g.addColorStop(1, '#030305');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (const star of stars) {
      ctx.fillStyle = `rgba(180,255,245,${star.alpha})`;
      ctx.fillRect(star.x, star.y, Math.max(1, star.z * 2), Math.max(1, star.z * 6));
    }

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#00f0c8';
    for (let y = -68 + (frame * speed * 1.5) % 68; y < H + 68; y += 68) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawIdle() {
    ctx.save();
    ctx.globalAlpha = 0.42;
    for (let i = 0; i < 7; i += 1) {
      ctx.strokeStyle = `rgba(0,240,200,${0.12 - i * 0.012})`;
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.58, 60 + i * 42 + Math.sin(frame * 0.02 + i) * 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTrail() {
    for (const trail of player.trail) {
      const alpha = trail.life / trail.max;
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = trail.color;
      ctx.shadowColor = trail.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, trail.radius * (1.2 - alpha * 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.bank);

    if (player.grace > 0 && frame % 6 < 3) {
      ctx.globalAlpha = 0.48;
    }

    ctx.shadowColor = player.shieldActive ? '#00c8ff' : '#c8a96a';
    ctx.shadowBlur = player.shieldActive ? 32 : 18;

    ctx.fillStyle = '#f5f1e7';
    ctx.beginPath();
    ctx.moveTo(0, -29);
    ctx.lineTo(20, 27);
    ctx.lineTo(0, 13);
    ctx.lineTo(-20, 27);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#c8a96a';
    ctx.beginPath();
    ctx.arc(0, -2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,240,200,.72)';
    ctx.fillRect(-5, 17, 10, 22);

    if (player.shieldActive) {
      ctx.strokeStyle = 'rgba(0,200,255,.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 34 + Math.sin(frame * 0.16) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawObstacles() {
    for (const o of obstacles) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rot);
      ctx.fillStyle = o.color;
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 18;
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(-o.w / 2 + 4, -o.h / 2 + 4, o.w - 8, o.h - 8);
      ctx.restore();
    }
  }

  function roundedRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawGates() {
    for (const gate of gates) {
      ctx.save();
      ctx.translate(gate.x, gate.y);
      ctx.strokeStyle = gate.good ? '#00f0c8' : '#ff3366';
      ctx.fillStyle = gate.good ? 'rgba(0,240,200,.08)' : 'rgba(255,51,102,.09)';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 18;

      roundedRect(ctx, -gate.w / 2, -gate.h / 2, gate.w, gate.h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = '700 12px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gate.label, 0, 1);

      ctx.restore();
    }
  }

  function drawGems() {
    for (const gem of gems) {
      ctx.save();
      ctx.translate(gem.x, gem.y);
      ctx.rotate(gem.angle);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(0, -gem.radius * 1.5);
      ctx.lineTo(gem.radius, 0);
      ctx.lineTo(0, gem.radius * 1.5);
      ctx.lineTo(-gem.radius, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const particle of particles) {
      const alpha = particle.life / particle.max;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawForeground() {
    const progress = clamp(altitude / CONFIG.targetAltitude, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = '#00f0c8';
    ctx.fillRect(0, 0, W * progress, 2);
    ctx.restore();

    if (altitude > CONFIG.targetAltitude * 0.82) {
      ctx.save();
      ctx.globalAlpha = 0.13 + Math.sin(frame * 0.08) * 0.05;
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  function drawMinimap() {
    if (!mapCtx || !mapCanvas) return;

    mapCtx.clearRect(0, 0, 100, 140);
    mapCtx.fillStyle = 'rgba(0,0,0,.45)';
    mapCtx.fillRect(0, 0, 100, 140);
    mapCtx.strokeStyle = 'rgba(0,240,200,.3)';
    mapCtx.strokeRect(0.5, 0.5, 99, 139);

    mapCtx.fillStyle = '#00f0c8';
    mapCtx.beginPath();
    mapCtx.arc((player.x / W) * 100, 109, 3, 0, Math.PI * 2);
    mapCtx.fill();

    for (const obstacle of obstacles) {
      const y = (obstacle.y / H) * 140;
      if (y >= 0 && y <= 140) {
        mapCtx.fillStyle = '#ff3366';
        mapCtx.fillRect((obstacle.x / W) * 100 - 2, y - 2, 4, 4);
      }
    }
  }

  function loop() {
    if (mode === 'play') {
      updatePlaying();
    } else {
      frame += 1;
      for (const star of stars) {
        star.y += star.z * 0.42;
        if (star.y > H + 8) {
          star.y = -8;
          star.x = Math.random() * W;
        }
      }
    }

    draw();
    requestAnimationFrame(loop);
  }

  function bindClick(id, fn) {
    const node = $(id);
    if (!node) return;

    node.addEventListener('click', (event) => {
      event.preventDefault();
      resumeAudio();
      fn();
    });
  }

  function setupUI() {
    bindClick('start', startRun);
    bindClick('retry', startRun);
    bindClick('again', startRun);

    bindClick('settings', () => {
      updateStatsUI();
      showScreen('cfg');
    });

    bindClick('back', () => {
      updateStatsUI();
      showScreen('menu');
    });

    bindClick('easy', () => setDifficulty('easy'));
    bindClick('normal', () => setDifficulty('normal'));
    bindClick('hard', () => setDifficulty('hard'));

    for (const button of document.querySelectorAll('.upg')) {
      button.addEventListener('click', () => {
        selectedLoadout = button.dataset.u || 'balanced';
        for (const item of document.querySelectorAll('.upg')) {
          item.classList.remove('sel');
        }
        button.classList.add('sel');
        tone(520, 'triangle', 0.1, 0.04, 760);
      });
    }

    bindToggle('tsfx', 'sfx');
    bindToggle('tmus', 'music');
    bindToggle('tsha', 'shake');

    updateStatsUI();
  }

  function bindToggle(id, key) {
    const node = $(id);
    if (!node) return;

    node.classList.toggle('on', Boolean(settings[key]));
    node.addEventListener('click', () => {
      settings[key] = !settings[key];
      node.classList.toggle('on', Boolean(settings[key]));
      saveJSON('ag0001_settings_v31', settings);
      if (!settings.music) setMusic(false);
      tone(420, 'sine', 0.08, 0.03, 540);
    });
  }

  function setDifficulty(name) {
    settings.difficulty = name;
    saveJSON('ag0001_settings_v31', settings);
    updateStatsUI();
    tone(name === 'hard' ? 720 : name === 'easy' ? 360 : 520, 'triangle', 0.1, 0.03, 760);
  }

  function setupInput() {
    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();

      if (event.key === 'ArrowLeft' || key === 'a') input.left = true;
      if (event.key === 'ArrowRight' || key === 'd') input.right = true;
      if (event.key === 'ArrowUp' || key === 'w') input.boost = true;

      if (event.code === 'Space' || key === 's') {
        if (mode === 'play') input.shield = true;
        else if (mode === 'over' || mode === 'win') startRun();
      }

      if (event.key === 'Escape' && mode === 'play') showScreen('menu');
    });

    window.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      if (event.key === 'ArrowLeft' || key === 'a') input.left = false;
      if (event.key === 'ArrowRight' || key === 'd') input.right = false;
      if (event.key === 'ArrowUp' || key === 'w') input.boost = false;
    });

    canvas.addEventListener('pointerdown', (event) => {
      input.pointer = true;
      input.pointerX = event.clientX;
      resumeAudio();
    });

    canvas.addEventListener('pointermove', (event) => {
      if (input.pointer) input.pointerX = event.clientX;
    });

    window.addEventListener('pointerup', () => {
      input.pointer = false;
    });

    bindHold('ml', 'left');
    bindHold('mr', 'right');
    bindHold('mb', 'boost');

    const shieldButton = $('ms');
    if (shieldButton) {
      shieldButton.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        input.shield = true;
        shieldButton.classList.add('a');
        setTimeout(() => shieldButton.classList.remove('a'), 120);
      });
    }
  }

  function bindHold(id, key) {
    const node = $(id);
    if (!node) return;

    const down = (event) => {
      event.preventDefault();
      input[key] = true;
      node.classList.add('a');
      resumeAudio();
    };

    const up = (event) => {
      event.preventDefault();
      input[key] = false;
      node.classList.remove('a');
    };

    node.addEventListener('pointerdown', down);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    node.addEventListener('pointerleave', up);
  }

  function boot() {
    resize();
    setupUI();
    setupInput();
    updateStatsUI();
    showScreen('menu');
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setMusic(false);
    else if (mode === 'play' && settings.music) setMusic(true);
  });

  boot();
})();
