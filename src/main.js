(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const altitudeEl = document.getElementById("altitude");
  const stabilityEl = document.getElementById("stability");
  const boundaryEl = document.getElementById("boundary");

  const state = {
    running: true,
    t: 0,
    altitude: 0,
    stability: 100,
    boundary: 0,
    keys: new Set(),
    ship: {
      x: canvas.width / 2,
      y: canvas.height - 118,
      vx: 0,
      radius: 18
    },
    obstacles: []
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function reset() {
    state.running = true;
    state.t = 0;
    state.altitude = 0;
    state.stability = 100;
    state.boundary = 0;
    state.ship.x = canvas.width / 2;
    state.ship.vx = 0;
    state.obstacles.length = 0;
  }

  function spawnObstacle() {
    const width = 54 + Math.random() * 86;
    const x = 40 + Math.random() * (canvas.width - 80 - width);
    state.obstacles.push({
      x,
      y: -90,
      w: width,
      h: 22 + Math.random() * 34,
      speed: 2.4 + state.boundary * 0.035 + Math.random() * 1.8
    });
  }

  function update() {
    if (!state.running) return;

    state.t += 1;
    state.altitude += 1 + state.boundary * 0.01;

    if (state.t % 34 === 0) {
      state.boundary += 1;
      spawnObstacle();
    }

    const left = state.keys.has("ArrowLeft") || state.keys.has("a");
    const right = state.keys.has("ArrowRight") || state.keys.has("d");

    if (left) state.ship.vx -= 0.92;
    if (right) state.ship.vx += 0.92;

    state.ship.vx *= 0.88;
    state.ship.x = clamp(state.ship.x + state.ship.vx, 34, canvas.width - 34);

    for (const obstacle of state.obstacles) {
      obstacle.y += obstacle.speed;
      const closestX = clamp(state.ship.x, obstacle.x, obstacle.x + obstacle.w);
      const closestY = clamp(state.ship.y, obstacle.y, obstacle.y + obstacle.h);
      const dx = state.ship.x - closestX;
      const dy = state.ship.y - closestY;

      if ((dx * dx + dy * dy) < state.ship.radius * state.ship.radius) {
        state.stability = 0;
        state.running = false;
      }
    }

    state.obstacles = state.obstacles.filter((o) => o.y < canvas.height + 80);

    state.stability = clamp(
      100 - Math.floor(state.boundary * 0.9) + Math.floor(Math.abs(state.ship.vx) * 0.7),
      1,
      100
    );

    altitudeEl.textContent = Math.floor(state.altitude).toString();
    stabilityEl.textContent = `${state.stability}%`;
    boundaryEl.textContent = state.boundary.toString();
  }

  function drawGrid() {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "#c8a96a";
    ctx.lineWidth = 1;

    for (let y = (state.t * 2) % 72; y < canvas.height; y += 72) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawShip() {
    const { x, y } = state.ship;

    ctx.save();
    ctx.translate(x, y);

    ctx.shadowColor = "rgba(200,169,106,0.65)";
    ctx.shadowBlur = 22;
    ctx.fillStyle = "#f3f0e8";
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(20, 26);
    ctx.lineTo(0, 14);
    ctx.lineTo(-20, 26);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#c8a96a";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawObstacles() {
    for (const obstacle of state.obstacles) {
      ctx.save();
      ctx.fillStyle = "rgba(255,92,92,0.82)";
      ctx.shadowColor = "rgba(255,92,92,0.55)";
      ctx.shadowBlur = 18;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);

      ctx.globalAlpha = 0.72;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(obstacle.x + 8, obstacle.y + 6, obstacle.w - 16, 2);
      ctx.restore();
    }
  }

  function drawOverlay() {
    if (state.running) return;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#f3f0e8";
    ctx.font = "700 34px system-ui";
    ctx.fillText("BOUNDARY BREACH", canvas.width / 2, canvas.height / 2 - 12);

    ctx.fillStyle = "#c8a96a";
    ctx.font = "500 18px system-ui";
    ctx.fillText("Press Space to restart", canvas.width / 2, canvas.height / 2 + 28);
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#121722");
    gradient.addColorStop(1, "#050609");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawObstacles();
    drawShip();
    drawOverlay();
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === " " && !state.running) {
      reset();
      return;
    }

    state.keys.add(event.key);
  });

  window.addEventListener("keyup", (event) => {
    state.keys.delete(event.key);
  });

  loop();
})();
