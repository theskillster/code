// OpenCode frontend — "Neon Runner": a 2D neon platformer with two levels.
// Level 1: Neon Meadows (original). Level 2: The Voltage Vault — flying volts,
// spike landings, faster patrollers, and locked gates that need keys.
(() => {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  if (!canvas) {
    // Backwards-compatible no-op if the game markup is missing.
    console.log("OpenCode frontend loaded");
    return;
  }
  const ctx = canvas.getContext("2d");
  const W = 960;
  const H = 540;
  // Crisp rendering on HiDPI displays (DPR capped at 2 to keep the canvas sane).
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  // ---------------------------------------------------------------------------
  // DOM
  // ---------------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const lsGet = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null; // storage unavailable (private mode / sandboxed iframe)
    }
  };
  const lsSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  };
  const els = {
    overlay: $("game-overlay"),
    overlayTitle: $("overlay-title"),
    overlayText: $("overlay-text"),
    overlayBtn: $("btn-start"),
    btnSound: $("btn-sound"),
    btnPause: $("btn-pause"),
    hudScore: $("hud-score"),
    hudCoins: $("hud-coins"),
    hudLives: $("hud-lives"),
    hudBest: $("hud-best"),
    hudTime: $("hud-time"),
    hudLevel: $("hud-level"),
    hudKey: $("hud-key"),
    levelBadge: $("level-name-badge"),
  };

  // ---------------------------------------------------------------------------
  // Audio (tiny WebAudio synth, no assets)
  // ---------------------------------------------------------------------------
  let audioCtx = null;
  let soundOn = lsGet("opencode-sound") !== "off";
  els.btnSound.textContent = soundOn ? "🔊" : "🔇";

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function tone(freq, dur, type = "square", vol = 0.14, slide = 0, delay = 0) {
    if (!soundOn || !audioCtx) return;
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  const sfx = {
    jump: () => tone(330, 0.16, "square", 0.1, 240),
    coin: () => {
      tone(880, 0.08, "sine", 0.12);
      tone(1318, 0.12, "sine", 0.12, 0, 0.07);
    },
    key: () => {
      tone(660, 0.1, "sine", 0.13);
      tone(990, 0.16, "sine", 0.13, 0, 0.09);
    },
    gate: () => tone(200, 0.5, "sawtooth", 0.1, 360),
    stomp: () => tone(220, 0.12, "square", 0.13, -90),
    hurt: () => tone(340, 0.3, "sawtooth", 0.14, -200),
    pause: () => tone(520, 0.08, "sine", 0.09),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.15, 0, i * 0.11)),
    level: () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.14, "triangle", 0.14, 0, i * 0.1)),
    over: () => [392, 311, 233, 155].forEach((f, i) => tone(f, 0.28, "sawtooth", 0.12, 0, i * 0.16)),
  };

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------
  const keys = { left: false, right: false, jump: false, jumpPressed: false };
  const KEYMAP = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    Space: "jump",
    ArrowUp: "jump",
    KeyW: "jump",
  };

  function setKey(code, down) {
    const k = KEYMAP[code];
    if (!k) return;
    if (down && !keys[k] && k === "jump") keys.jumpPressed = true;
    keys[k] = down;
  }

  window.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    setKey(e.code, true);
    if (e.code === "KeyP" || e.code === "Escape") togglePause();
    if (e.code === "KeyR") restartRun();
  });
  window.addEventListener("keyup", (e) => {
    setKey(e.code, false);
    // Variable jump height: releasing the jump key cuts upward velocity.
    if ((e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") && player.vy < -260) {
      player.vy = -260;
    }
  });

  // Touch / pointer controls (shown only on coarse pointers via CSS).
  document.querySelectorAll(".touch-controls button").forEach((btn) => {
    const k = btn.dataset.key;
    const down = (e) => {
      e.preventDefault();
      if (k === "jump" && !keys.jump) keys.jumpPressed = true;
      keys[k] = true;
    };
    const up = (e) => {
      e.preventDefault();
      if (k === "jump" && keys.jump && player.vy < -260) player.vy = -260;
      keys[k] = false;
    };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("pointercancel", up);
  });

  // ---------------------------------------------------------------------------
  // Level data
  // ---------------------------------------------------------------------------
  const GROUND_H = 60;
  const GROUND_Y = H - GROUND_H;
  const LEVEL_MAX_W = 5120; // widest level, used for the starfield layout

  const platforms = [];
  const coins = [];
  const enemies = [];
  const spikes = [];
  const keyItems = [];
  const gates = [];
  const flag = { x: 0 };

  const ground = (x, w) => platforms.push({ x, y: GROUND_Y, w, h: GROUND_H, kind: "ground" });
  const plat = (x, y, w, h = 26) => platforms.push({ x, y, w, h, kind: "plat" });
  const coin = (x, y) => coins.push({ x, y, r: 11, taken: false });
  const enemy = (x, min, max, speed = 72) =>
    enemies.push({ x, y: GROUND_Y - 40, w: 44, h: 40, min, max, dir: 1, speed, alive: true, kind: "walker" });
  const flyer = (x, min, max, baseY, amp, bobSpeed, phase = 0) =>
    enemies.push({
      x,
      y: baseY,
      w: 34,
      h: 26,
      min,
      max,
      dir: 1,
      speed: 36,
      alive: true,
      kind: "flyer",
      baseY,
      amp,
      bobSpeed,
      phase,
    });
  const spike = (x, w = 48) => spikes.push({ x, y: GROUND_Y - 16, w, h: 16 });
  const key = (x, y, label) => keyItems.push({ x, y, r: 12, label, taken: false });
  const gate = (x, h, label) => gates.push({ x, y: GROUND_Y - h, w: 14, h, label, opened: false, opening: 0 });
  const coinArc = (cx, cy, n) => {
    for (let i = 0; i < n; i++) coin(cx + i * 34, cy - Math.sin((i / (n - 1)) * Math.PI) * 46);
  };

  // Per-level visual themes (palettes switch in loadLevel).
  const THEMES = {
    1: {
      sky: ["#0b1020", "#16224a", "#1e2f5c"],
      star: "#cbd5e1",
      moon: "#e2e8f0",
      hillA: "#1a2342",
      hillB: "#141b33",
      groundTop: "#1f2a44",
      groundBody: "#33455f",
      groundEdge: "#22d3ee",
      groundGlow: "rgba(34,211,238,0.18)",
      platBody: "#0d9488",
      platTop: "#5eead4",
      flag: "#38bdf8",
      gate: "#e879f9",
    },
    2: {
      sky: ["#190a33", "#30104f", "#233464"],
      star: "#e9d5ff",
      moon: "#f5f3ff",
      hillA: "#231a42",
      hillB: "#171030",
      groundTop: "#241b40",
      groundBody: "#3a2c5c",
      groundEdge: "#e879f9",
      groundGlow: "rgba(232,121,249,0.16)",
      platBody: "#7e22ce",
      platTop: "#e879f9",
      flag: "#f472b6",
      gate: "#e879f9",
    },
  };

  const LEVELS = {
    1: {
      name: "Neon Meadows",
      width: 5120,
      flagX: 4860,
      checkpoints: [500, 1000, 1500, 2100, 2700, 3300, 4000, 4700],
      build() {
        // Ground segments with gaps, floating platforms, coins, spikes and
        // patrolling enemies.
        ground(0, 620);
        plat(680, 420, 130);
        ground(800, 420);
        coinArc(690, 400, 3);

        coinArc(1250, 330, 3);
        plat(1260, 360, 120);
        ground(1380, 480);
        coin(1300, 340);
        coin(1335, 320);
        coin(1370, 340);
        spike(1660, 46);

        ground(1980, 520);
        plat(2140, 380, 120);
        coinArc(2150, 360, 3);

        ground(2620, 520);
        plat(2520, 350, 110);
        coin(2530, 330);
        coin(2575, 310);
        plat(2700, 400, 130);
        coinArc(2710, 380, 3);
        spike(2840, 44);

        ground(3260, 560);
        plat(3400, 370, 120);
        coinArc(3410, 350, 3);
        spike(3520, 44);

        ground(3940, 600);
        plat(4020, 350, 120);
        coinArc(4030, 330, 3);
        spike(4420, 50);

        ground(4660, 460);
        coinArc(4680, 420, 3);
        coinArc(4780, 380, 4);

        enemy(350, 120, 580, 60);
        enemy(1050, 830, 1180, 75);
        enemy(1520, 1450, 1610, 65);
        enemy(2350, 2040, 2460, 80);
        enemy(2920, 2700, 2810, 70);
        enemy(3450, 3320, 3500, 70);
        enemy(4300, 4000, 4390, 72);
      },
    },
    2: {
      name: "The Voltage Vault",
      width: 4600,
      flagX: 4480,
      checkpoints: [430, 950, 1660, 2120, 2560, 3000, 3520, 4300],
      build() {
        // Tighter, meaner: spikes right after landings, faster patrollers,
        // hovering "volt" flyers, and two locked gates that need their keys.
        ground(0, 470);
        plat(520, 400, 110);
        plat(660, 330, 110);
        coinArc(670, 310, 3);

        ground(900, 380);
        spike(990, 44);
        coinArc(950, 430, 3);
        enemy(1080, 920, 1240, 95);

        plat(1330, 380, 110);
        coin(1340, 360);
        coin(1380, 340);

        ground(1540, 360);
        spike(1630, 44);
        flyer(1910, 1905, 1995, 390, 40, 2.0, 0); // guards the gap

        ground(2000, 400);
        spike(2100, 44);
        enemy(2160, 2050, 2340, 100);
        coin(2280, 430);

        ground(2520, 300);
        plat(2530, 350, 90);
        key(2575, 330, "A");
        flyer(2545, 2530, 2620, 300, 35, 1.6, 2); // guards key A
        gate(2700, 300, "A");
        coin(2660, 430);

        ground(2900, 420);
        spike(2990, 44);
        enemy(3060, 2960, 3260, 105);
        coinArc(3100, 400, 3);

        plat(3340, 370, 120);
        coinArc(3350, 350, 3);

        ground(3460, 320);
        plat(3470, 370, 100);
        key(3520, 350, "B");
        flyer(3490, 3470, 3570, 320, 35, 1.7, 4); // guards key B
        gate(3600, 300, "B");
        spike(3680, 44);
        coin(3700, 430);

        plat(3820, 400, 110);
        plat(3960, 340, 100);
        coinArc(3830, 380, 3);
        coin(3970, 320);

        ground(4120, 480);
        spike(4250, 50);
        enemy(4330, 4300, 4420, 110);
        coinArc(4360, 420, 3);
        coinArc(4440, 380, 4);
      },
    },
  };

  // ---------------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------------
  const GRAV = 2300;
  const MOVE = 340;
  const JUMP_V = 800;
  const MAX_FALL = 1300;
  const COYOTE = 0.09;
  const BUFFER = 0.12;

  const player = {
    x: 80,
    y: GROUND_Y - 46,
    w: 34,
    h: 46,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    coyote: 0,
    jumpBuffer: 0,
    invuln: 0,
    run: 0,
  };

  let state = "menu"; // menu | playing | paused | win | over
  let score = 0;
  let coinCount = 0;
  let keyCount = 0;
  let lives = 3;
  let time = 0;
  let best = parseInt(lsGet("opencode-best") || "0", 10) || 0;
  const checkpoint = { x: 80, y: GROUND_Y - 46 };
  let animTime = 0;
  let overlayAction = null;

  // Level bookkeeping (filled in by loadLevel).
  let currentLevel = 1;
  const totalLevels = 2;
  let levelW = LEVEL_MAX_W;
  let totalCoins = 0;
  let CHECKPOINTS = [];
  let theme = THEMES[1];

  const particles = [];
  const stars = [];
  for (let i = 0; i < 70; i++) {
    stars.push({ x: (i * 137.5) % LEVEL_MAX_W, y: (i * 61.7) % 240, r: (i % 3) + 0.7 });
  }
  const clouds = [];
  for (let i = 0; i < 8; i++) {
    clouds.push({ x: i * 700 + (i * 173) % 400, y: 50 + (i * 47) % 140, s: 0.7 + ((i * 13) % 10) / 10 });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const circleRect = (cx, cy, r, rc) => {
    const nx = Math.max(rc.x, Math.min(cx, rc.x + rc.w));
    const ny = Math.max(rc.y, Math.min(cy, rc.y + rc.h));
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  };
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  const fmtTime = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  // ---------------------------------------------------------------------------
  // Particles
  // ---------------------------------------------------------------------------
  function sparkle(x, y) {
    for (let i = 0; i < 8; i++)
      particles.push({ x, y, vx: (Math.random() - 0.5) * 220, vy: -Math.random() * 180 - 40, life: 0.5, t: 0, color: "#fde68a", size: 3 });
  }
  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 160;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.6, t: 0, color: "#f0abfc", size: 4 });
    }
  }
  function dust(x, y, n) {
    for (let i = 0; i < n; i++)
      particles.push({ x: x + (Math.random() - 0.5) * 20, y, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 60, life: 0.35, t: 0, color: "#64748b", size: 3 });
  }
  function confetti() {
    const colors = ["#38bdf8", "#f472b6", "#fbbf24", "#4ade80"];
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 280;
      particles.push({
        x: camera.x + W / 2,
        y: H * 0.4,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 140,
        life: 1.7,
        t: 0,
        color: colors[i % 4],
        size: 4,
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      if (p.t >= p.life) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += 500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  // ---------------------------------------------------------------------------
  // Flow control
  // ---------------------------------------------------------------------------
  const camera = { x: 0 };

  function showOverlay(title, text, btnLabel, action) {
    els.overlayTitle.textContent = title;
    els.overlayText.innerHTML = text;
    els.overlayBtn.textContent = btnLabel;
    overlayAction = action;
    els.overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    els.overlay.classList.add("hidden");
  }

  function loadLevel(n) {
    currentLevel = n;
    const L = LEVELS[n];
    platforms.length = 0;
    coins.length = 0;
    enemies.length = 0;
    spikes.length = 0;
    keyItems.length = 0;
    gates.length = 0;
    particles.length = 0;
    coinCount = 0;
    keyCount = 0;
    time = 0;
    L.build();
    levelW = L.width;
    flag.x = L.flagX;
    totalCoins = coins.length;
    CHECKPOINTS = L.checkpoints;
    theme = THEMES[n];
  }

  function resetPlayer() {
    player.x = 80;
    player.y = GROUND_Y - 46;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.invuln = 0;
    checkpoint.x = 80;
    checkpoint.y = GROUND_Y - 46;
    camera.x = 0;
  }

  // Fresh full run (starts at level 1).
  function start() {
    ensureAudio();
    keys.jumpPressed = false; // don't leak a jump held during the menu into the run
    score = 0;
    lives = 3;
    loadLevel(1);
    resetPlayer();
    state = "playing";
    hideOverlay();
  }

  // Begin playing the already-loaded level (used by the level-intro overlay).
  function enterLevel() {
    ensureAudio();
    keys.jumpPressed = false;
    state = "playing";
    hideOverlay();
  }

  // Jump straight to a specific level (dev/testing hook).
  function playLevel(n) {
    ensureAudio();
    loadLevel(n);
    resetPlayer();
    state = "playing";
    hideOverlay();
  }

  function nextLevel() {
    loadLevel(currentLevel + 1);
    resetPlayer();
    state = "menu";
    sfx.level();
    showOverlay(
      `Level ${currentLevel} — ${LEVELS[currentLevel].name}`,
      "New hazards: flying volts, spike landings, faster patrollers…<br>and <strong>locked gates</strong> that only open when you find their key.<br>Score and lives carry over from Level 1.",
      "Enter ▶",
      enterLevel
    );
  }

  function togglePause() {
    if (state === "playing") {
      state = "paused";
      sfx.pause();
      showOverlay("Paused", "Hit <kbd>P</kbd> or press Resume to keep going.", "Resume", resume);
    } else if (state === "paused") {
      resume();
    }
  }

  function resume() {
    ensureAudio();
    keys.jumpPressed = false;
    state = "playing";
    hideOverlay();
  }

  function restartRun() {
    if (state === "playing" || state === "paused") start();
  }

  function hurt(fell = false) {
    // Falling into a void must always respawn, even mid-invulnerability,
    // otherwise the player would fall forever (soft-lock).
    if (!fell && player.invuln > 0) return;
    lives--;
    sfx.hurt();
    if (lives <= 0) {
      gameOver();
      return;
    }
    player.x = checkpoint.x;
    player.y = checkpoint.y;
    player.vx = 0;
    player.vy = 0;
    player.invuln = 2.2;
    dust(player.x + player.w / 2, player.y + player.h, 6);
  }

  function win() {
    const bonus = Math.max(0, 300 - Math.floor(time));
    score += bonus;
    if (score > best) {
      best = score;
      lsSet("opencode-best", String(best));
    }
    state = "win";
    sfx.win();
    confetti();
    const level = LEVELS[currentLevel];
    if (currentLevel < totalLevels) {
      showOverlay(
        `Level ${currentLevel} complete! 🏁`,
        `Score <strong>${score}</strong> (incl. time bonus +${bonus}) · Coins ${coinCount}/${totalCoins} · Time ${fmtTime(time)}`,
        "Next level ▶",
        nextLevel
      );
    } else {
      showOverlay(
        "You beat the game! 🏆",
        `Final score <strong>${score}</strong> (incl. bonuses) · Coins ${coinCount}/${totalCoins} · Time ${fmtTime(time)}<br>Best <strong>${best}</strong>`,
        "Play again",
        start
      );
    }
  }

  function gameOver() {
    state = "over";
    sfx.over();
    showOverlay(
      "Game over",
      `You ran out of lives on Level ${currentLevel}. Score <strong>${score}</strong> · Best <strong>${best}</strong>`,
      "Try again",
      start
    );
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  function update(dt) {
    time += dt;
    player.coyote = player.onGround ? COYOTE : Math.max(0, player.coyote - dt);
    player.jumpBuffer = keys.jumpPressed ? BUFFER : Math.max(0, player.jumpBuffer - dt);
    keys.jumpPressed = false;
    player.invuln = Math.max(0, player.invuln - dt);

    // Horizontal movement + X collision.
    player.vx = 0;
    if (keys.left) player.vx = -MOVE;
    if (keys.right) player.vx = MOVE;
    if (player.vx !== 0) player.facing = player.vx > 0 ? 1 : -1;
    player.x += player.vx * dt;
    player.x = Math.max(0, Math.min(player.x, levelW - player.w));
    for (const p of platforms) {
      if (overlap(player, p)) {
        if (player.vx > 0) player.x = p.x - player.w;
        else if (player.vx < 0) player.x = p.x + p.w;
        player.vx = 0;
      }
    }

    // Jump (coyote time + input buffering).
    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -JUMP_V;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.onGround = false;
      sfx.jump();
      dust(player.x + player.w / 2, player.y + player.h, 5);
    }

    // Vertical movement + Y collision, sub-stepped so fast falls can't tunnel
    // through the 26px-thick floating platforms.
    player.vy = Math.min(player.vy + GRAV * dt, MAX_FALL);
    player.onGround = false;
    const V_STEP = 12;
    const fall = player.vy * dt;
    const steps = Math.max(1, Math.ceil(Math.abs(fall) / V_STEP));
    const stepDist = fall / steps;
    for (let s = 0; s < steps; s++) {
      player.y += stepDist;
      for (const p of platforms) {
        if (overlap(player, p)) {
          const prevBottom = player.y + player.h - stepDist;
          if (stepDist > 0 && prevBottom <= p.y + 8) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.onGround = true;
          } else if (stepDist < 0) {
            player.y = p.y + p.h;
            player.vy = 0;
          } else {
            const mid = player.x + player.w / 2;
            if (mid < p.x + p.w / 2) player.x = p.x - player.w;
            else player.x = p.x + p.w;
          }
        }
      }
      if (player.vy === 0) break;
    }

    // Gates act as solid walls until their key unlocks them.
    for (const g of gates) {
      if (g.opened) continue;
      if (overlap(player, g)) {
        const mid = player.x + player.w / 2;
        if (mid < g.x + g.w / 2) player.x = g.x - player.w;
        else player.x = g.x + g.w;
        player.vx = 0;
      }
    }

    // Run animation.
    if (player.onGround && Math.abs(player.vx) > 0) player.run += dt * 12;
    else player.run += dt * 4;

    // Coins.
    for (const c of coins) {
      if (!c.taken && circleRect(c.x, c.y, c.r, player)) {
        c.taken = true;
        score += 10;
        coinCount++;
        sfx.coin();
        sparkle(c.x, c.y);
      }
    }

    // Keys unlock their matching gates.
    for (const k of keyItems) {
      if (!k.taken && circleRect(k.x, k.y, k.r, player)) {
        k.taken = true;
        score += 100;
        keyCount++;
        sfx.key();
        burst(k.x, k.y, 14);
        for (const g of gates) {
          if (!g.opened && g.label === k.label) {
            g.opened = true;
            sfx.gate();
          }
        }
      }
    }
    // Gate opening animation.
    for (const g of gates) {
      if (g.opened && g.opening < 1) g.opening = Math.min(1, g.opening + dt * 2.2);
    }

    // Enemies (patrol + stomp). Flyers also bob up and down.
    for (const e of enemies) {
      if (!e.alive) continue;
      e.x += e.dir * e.speed * dt;
      if (e.x <= e.min) {
        e.x = e.min;
        e.dir = 1;
      }
      if (e.x + e.w >= e.max) {
        e.x = e.max - e.w;
        e.dir = -1;
      }
      if (e.kind === "flyer") {
        e.y = e.baseY + Math.sin(animTime * e.bobSpeed + e.phase) * e.amp;
      }
      if (player.invuln > 0) continue;
      if (overlap(player, e)) {
        const stomping = player.vy > 120 && player.y + player.h - e.y < e.h * 0.7;
        if (stomping) {
          e.alive = false;
          player.vy = -JUMP_V * 0.62;
          score += 50;
          sfx.stomp();
          burst(e.x + e.w / 2, e.y + e.h / 2, 12);
        } else {
          hurt();
        }
      }
    }

    // Spikes.
    if (player.invuln <= 0) {
      for (const s of spikes) {
        if (overlap(player, s)) {
          hurt();
          break;
        }
      }
    }

    // Fell into a pit.
    if (player.y > H + 80) hurt(true);

    // Reached the flag.
    if (player.x + player.w > flag.x && player.y + player.h > GROUND_Y - 40) win();

    // Checkpoints (safe respawn points on the ground).
    for (const t of CHECKPOINTS) {
      if (player.x > t && player.onGround && t > checkpoint.x) {
        checkpoint.x = t;
        checkpoint.y = GROUND_Y - player.h;
      }
    }
  }

  function updateCamera() {
    const target = player.x + player.w / 2 - W * 0.4;
    camera.x = Math.max(0, Math.min(target, levelW - W));
  }

  // ---------------------------------------------------------------------------
  // Draw
  // ---------------------------------------------------------------------------
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.sky[0]);
    g.addColorStop(0.7, theme.sky[1]);
    g.addColorStop(1, theme.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Stars (parallax 0.15).
    ctx.fillStyle = theme.star;
    for (const s of stars) {
      const sx = ((s.x - camera.x * 0.15) % W + W) % W;
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(animTime * 2 + s.x);
      ctx.beginPath();
      ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Moon glow.
    const moonX = W - 110 - camera.x * 0.05;
    const moonY = 84;
    const glow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 90);
    glow.addColorStop(0, "rgba(226,232,240,0.28)");
    glow.addColorStop(1, "rgba(226,232,240,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(moonX - 90, moonY - 90, 180, 180);
    ctx.fillStyle = theme.moon;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.star;
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cloud layers (parallax).
    ctx.fillStyle = "rgba(148,163,184,0.14)";
    for (const c of clouds) {
      const cx = ((c.x - camera.x * 0.35) % (W + 200) + W + 200) % (W + 200) - 100;
      const s = c.s;
      ctx.beginPath();
      ctx.arc(cx, c.y, 26 * s, 0, Math.PI * 2);
      ctx.arc(cx + 30 * s, c.y - 10 * s, 20 * s, 0, Math.PI * 2);
      ctx.arc(cx + 55 * s, c.y, 24 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Parallax hills.
    const hill = (offset, baseY, r, spacing, color) => {
      ctx.fillStyle = color;
      const start = Math.floor(offset / spacing) - 1;
      for (let i = start; i < start + W / spacing + 2; i++) {
        ctx.beginPath();
        ctx.arc(i * spacing - offset, baseY, r, Math.PI, 0);
        ctx.fill();
      }
    };
    hill(camera.x * 0.25, 420, 130, 260, theme.hillA);
    hill(camera.x * 0.45, 452, 90, 200, theme.hillB);
  }

  function drawPlatforms() {
    for (const p of platforms) {
      if (p.kind === "ground") {
        ctx.fillStyle = theme.groundTop;
        ctx.fillRect(p.x, p.y + 6, p.w, p.h - 6);
        ctx.fillStyle = theme.groundBody;
        ctx.fillRect(p.x, p.y + 10, p.w, p.h - 14);
        ctx.fillStyle = theme.groundEdge;
        ctx.fillRect(p.x, p.y, p.w, 5);
        ctx.fillStyle = theme.groundGlow;
        ctx.fillRect(p.x, p.y + 5, p.w, 8);
      } else {
        ctx.fillStyle = theme.platBody;
        roundRect(p.x, p.y, p.w, p.h, 8);
        ctx.fill();
        ctx.fillStyle = theme.platTop;
        ctx.fillRect(p.x + 5, p.y + 2, p.w - 10, 5);
      }
    }
  }

  function drawSpikes() {
    for (const s of spikes) {
      ctx.fillStyle = "#ef4444";
      const n = Math.floor(s.w / 14);
      for (let i = 0; i < n; i++) {
        const x0 = s.x + i * 14;
        ctx.beginPath();
        ctx.moveTo(x0, s.y + s.h);
        ctx.lineTo(x0 + 7, s.y);
        ctx.lineTo(x0 + 14, s.y + s.h);
        ctx.fill();
      }
    }
  }

  function drawGates() {
    for (const g of gates) {
      if (g.opened && g.opening >= 1) continue;
      ctx.save();
      const rise = g.opening * g.h;
      ctx.globalAlpha = 1 - g.opening * 0.85;
      ctx.translate(0, -rise);

      // Frame + glowing rails.
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(g.x + 2, g.y, g.w - 4, g.h);
      ctx.fillStyle = theme.gate;
      ctx.fillRect(g.x + 3, g.y, 3, g.h);
      ctx.fillRect(g.x + g.w - 6, g.y, 3, g.h);

      // Warning slats.
      ctx.fillStyle = "rgba(240,171,252,0.4)";
      for (let i = 0; i < g.h; i += 22) ctx.fillRect(g.x, g.y + i, g.w, 2);

      if (!g.opened) {
        // Padlock.
        const px = g.x + g.w / 2;
        const py = g.y + g.h * 0.48;
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(px - 5, py - 5, 10, 9);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py - 6, 4.5, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(px - 1.5, py + 0.5, 3, 3);
        // Floating key hint above the gate.
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 17px system-ui";
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.55 + 0.35 * Math.sin(animTime * 4);
        ctx.fillText("🔑", px, g.y - 12);
      }
      ctx.restore();
    }
  }

  function drawKeys() {
    for (const k of keyItems) {
      if (k.taken) continue;
      const bob = Math.sin(animTime * 3 + k.x) * 3;
      const pulse = 1 + Math.sin(animTime * 5 + k.x * 0.1) * 0.1;
      const ky = k.y + bob;
      // Glow ring.
      ctx.fillStyle = "rgba(251,191,36,0.22)";
      ctx.beginPath();
      ctx.arc(k.x, ky, 17 * pulse, 0, Math.PI * 2);
      ctx.fill();
      // Key shape: bow + shaft + teeth.
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(k.x - 6, ky, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(k.x - 6, ky, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(k.x - 1, ky - 2.5, 13, 5);
      ctx.fillRect(k.x + 6, ky - 2.5, 3, 7);
      ctx.fillRect(k.x + 9.5, ky - 2.5, 2, 4.5);
    }
  }

  function drawCoins() {
    for (const c of coins) {
      if (c.taken) continue;
      const pulse = 1 + Math.sin(animTime * 5 + c.x * 0.1) * 0.08;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * pulse * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFlag() {
    const fx = flag.x;
    const wave = Math.sin(animTime * 4) * 4;
    ctx.fillStyle = "#64748b";
    ctx.fillRect(fx + 3, GROUND_Y - 8, 24, 8);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(fx + 13, GROUND_Y - 118, 5, 112);
    ctx.fillStyle = theme.flag;
    ctx.beginPath();
    ctx.moveTo(fx + 18, GROUND_Y - 118);
    ctx.quadraticCurveTo(fx + 46, GROUND_Y - 106 + wave, fx + 46, GROUND_Y - 88 + wave);
    ctx.lineTo(fx + 18, GROUND_Y - 76);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 15px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("★", fx + 32, GROUND_Y - 92 + wave);
  }

  function drawWalker(e) {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h);
    ctx.scale(e.dir, 1);
    ctx.fillStyle = "#701a75";
    ctx.fillRect(-10, -12, 8, 12);
    ctx.fillRect(2, -12, 8, 12);
    ctx.fillStyle = "#d946ef";
    roundRect(-13, -30, 26, 20, 8);
    ctx.fill();
    ctx.fillStyle = "#f0abfc";
    ctx.beginPath();
    ctx.moveTo(-9, -30);
    ctx.lineTo(-13, -38);
    ctx.lineTo(-4, -30);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -30);
    ctx.lineTo(13, -38);
    ctx.lineTo(4, -30);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(3, -24, 6, 7);
    ctx.fillRect(-9, -24, 6, 7);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(5, -23, 3, 4);
    ctx.fillRect(-7, -23, 3, 4);
    ctx.restore();
  }

  function drawFlyer(e) {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.scale(e.dir, 1);
    const z = Math.sin(animTime * 20 + e.x) * 2; // electric shimmer
    // Aura.
    ctx.fillStyle = "rgba(232,121,249,0.18)";
    ctx.beginPath();
    ctx.arc(0, z, 21, 0, Math.PI * 2);
    ctx.fill();
    // Body.
    ctx.fillStyle = "#d946ef";
    roundRect(-13, -14 + z, 26, 28, 12);
    ctx.fill();
    // Lightning bolt accent.
    ctx.fillStyle = "#fdf4ff";
    ctx.beginPath();
    ctx.moveTo(2, -10 + z);
    ctx.lineTo(-4, -2 + z);
    ctx.lineTo(0, -2 + z);
    ctx.lineTo(-2, 8 + z);
    ctx.lineTo(5, -1 + z);
    ctx.lineTo(1, -1 + z);
    ctx.closePath();
    ctx.fill();
    // Eyes.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-8, -6 + z, 5, 6);
    ctx.fillRect(3, -6 + z, 5, 6);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-6.5, -5 + z, 2.5, 3);
    ctx.fillRect(4.5, -5 + z, 2.5, 3);
    ctx.restore();
  }

  function drawEnemy(e) {
    if (e.kind === "flyer") drawFlyer(e);
    else drawWalker(e);
  }

  function drawPlayer() {
    const blink = player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = blink ? 0.3 : 1;
    ctx.translate(player.x + player.w / 2, player.y + player.h);
    ctx.scale(player.facing, 1);
    const str = player.onGround && Math.abs(player.vx) > 0 ? Math.sin(player.run) * 6 : 0;
    const legLift = player.onGround ? 0 : -5;
    ctx.fillStyle = "#155e75";
    ctx.fillRect(-10 + str * 0.5, -12 + legLift, 8, 12);
    ctx.fillRect(2 - str * 0.5, -12 + legLift, 8, 12);
    ctx.fillStyle = "#22d3ee";
    roundRect(-14, -34, 28, 24, 9);
    ctx.fill();
    ctx.fillStyle = "#a5f3fc";
    roundRect(-6, -28, 12, 14, 6);
    ctx.fill();
    ctx.fillStyle = "#f472b6";
    ctx.fillRect(-1, -41, 3, 8);
    ctx.beginPath();
    ctx.arc(0.5, -41, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(4, -29, 5, 6);
    ctx.fillRect(-9, -29, 5, 6);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(5.5, -28, 2, 2);
    ctx.fillRect(-7.5, -28, 2, 2);
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    drawBackground();

    ctx.save();
    ctx.translate(-camera.x, 0);

    drawPlatforms();
    drawSpikes();
    drawGates();
    drawCoins();
    drawKeys();
    drawFlag();
    for (const e of enemies) if (e.alive) drawEnemy(e);
    drawParticles();
    if (state !== "over") drawPlayer();

    ctx.restore();

    // Subtle vignette for depth.
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(2,6,23,0.5)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------------------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------------------
  function updateHUD() {
    els.hudScore.textContent = score;
    els.hudCoins.textContent = `${coinCount}/${totalCoins}`;
    els.hudLives.textContent = "♥".repeat(Math.max(0, lives)) + "♡".repeat(Math.max(0, 3 - lives));
    els.hudBest.textContent = best ? best : "—";
    els.hudTime.textContent = fmtTime(time);
    els.hudLevel.textContent = currentLevel;
    els.hudKey.textContent = keyCount > 0 ? "🔑" : "🔒";
    els.levelBadge.textContent = LEVELS[currentLevel].name;
  }

  // ---------------------------------------------------------------------------
  // Loop
  // ---------------------------------------------------------------------------
  let last = 0;
  function loop(ts) {
    const dt = Math.min((ts - last) / 1000 || 0, 1 / 30);
    last = ts;
    animTime += dt;
    if (state === "playing") {
      update(dt);
      updateCamera();
    }
    updateParticles(dt);
    draw();
    updateHUD();
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------------
  els.overlayBtn.addEventListener("click", () => {
    ensureAudio();
    els.overlayBtn.blur();
    if (overlayAction) overlayAction();
  });

  els.btnSound.addEventListener("click", () => {
    soundOn = !soundOn;
    lsSet("opencode-sound", soundOn ? "on" : "off");
    els.btnSound.textContent = soundOn ? "🔊" : "🔇";
    if (soundOn) {
      ensureAudio();
      sfx.coin();
    }
  });

  els.btnPause.addEventListener("click", () => {
    els.btnPause.blur();
    togglePause();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") togglePause();
  });

  canvas.addEventListener("pointerdown", (e) => e.preventDefault());

  // Small dev hook so levels can be exercised from the console.
  window.__neon = { playLevel, loadLevel, start, player };

  // Initial state.
  best = Math.max(best, 0);
  loadLevel(1);
  resetPlayer();
  showOverlay(
    "Neon Runner",
    "Collect coins, stomp baddies, and reach the flag!<br>Two levels of neon action — Level 2 adds flying volts and locked gates.<br>Touch-friendly controls light up on mobile.",
    "Start",
    start
  );
  updateHUD();
  requestAnimationFrame(loop);
})();
