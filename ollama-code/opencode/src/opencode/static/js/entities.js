// OpenCode — Entities (physics, player state, collision helpers, particles, update logic)
// Depends on: Levels (for scene arrays and constants), Input (for keys), Audio (for sfx)
// Exposes: player, physics constants, update(), updateCamera(), updateParticles(),
//          resetPlayer(), particles, helpers, and a shared GameState object

import { Input } from "./input.js";
import { Audio } from "./audio.js";
import { Levels } from "./levels.js";

export const Entities = (() => {
  "use strict";

  const { keys } = Input;
  const { sfx } = Audio;
  const {
    GROUND_H, GROUND_Y, W, H,
    platforms, coins, spikes, orbs,
    LEVELS, THEMES, LEVEL_MAX_W,
  } = Levels;

  // --- Physics constants ---
  const GRAV = 2300;
  const AUTO_SPEED = 340; // constant forward speed (Geometry Dash style)
  const JUMP_V = 700;
  const MAX_FALL = 1300;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const TILE = 48;

  // --- Player state ---
  const player = {
    x: 80,
    y: GROUND_Y - 46,
    w: 34,
    h: 46,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    angle: 0, // cube spin, degrees; snapped to 90° on landing
    trailT: 0, // trail particle spawn timer
    coyote: 0,
    jumpBuffer: 0,
    invuln: 0,
  };

  // --- Shared game state (mutated by both entities.js and game.js) ---
  const gameState = {
    state: "menu",
    score: 0,
    coinCount: 0,
    keyCount: 0,
    attempts: 0,
    time: 0,
    best: 0,
    levelW: LEVEL_MAX_W,
    CHECKPOINTS: [],
    theme: THEMES[1],
    currentLevel: 1,
    totalLevels: 3,
    totalCoins: 0,
    animTime: 0,
    checkpoint: { x: 80, y: GROUND_Y - 46 },
    camera: { x: 0 },
    overlayAction: null,
    // Death-sequence timer: while > 0, the player is frozen & flashing
    // before the level restarts and the attempt is counted.
    dying: 0,
  };

  // Callbacks for side effects (set by game.js during init).
  let _onHurt = null;
  let _onWin = null;
  let _onGameOver = null;
  let _onHurtResolve = null;

  function setCallbacks(onHurt, onWin, onHurtResolve) {
    _onHurt = onHurt;
    _onWin = onWin;
    _onHurtResolve = onHurtResolve;
  }

  // --- Particles ---
  const particles = [];

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

  // GD-style trail: fading squares left behind the cube every ~30ms.
  function trail(x, y, color) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 20, life: 0.35, t: 0, color, size: 8, noGravity: true });
  }

  function confetti() {
    const colors = ["#38bdf8", "#f472b6", "#fbbf24", "#4ade80"];
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 280;
      particles.push({
        x: gameState.camera.x + W / 2,
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

  // --- Collision helpers ---
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const circleRect = (cx, cy, r, rc) => {
    const nx = Math.max(rc.x, Math.min(cx, rc.x + rc.w));
    const ny = Math.max(rc.y, Math.min(cy, rc.y + rc.h));
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  };

  const fmtTime = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  // --- Update systems (each handles one aspect of the game loop) ---

  // Timers: frame-level bookkeeping (coyote, jump buffer, invulnerability).
  function updateTimers(dt) {
    const gs = gameState;
    gs.time += dt;
    player.coyote = player.onGround ? COYOTE : Math.max(0, player.coyote - dt);
    player.jumpBuffer = keys.jumpPressed ? BUFFER : Math.max(0, player.jumpBuffer - dt);
    keys.jumpPressed = false;
    player.invuln = Math.max(0, player.invuln - dt);
  }

  // Auto-run: the player always moves right at constant speed. No horizontal
  // control — Geometry Dash style. X-clamp only (no X push-out; block sides
  // are lethal and handled in updateVertical).
  function updateMovement(dt) {
    const gs = gameState;
    player.vx = AUTO_SPEED;
    player.facing = 1;
    player.x += player.vx * dt;
    player.x = Math.min(player.x, gs.levelW - player.w);
    // A block whose side the auto-runner clips (before vertical resolves)
    // must kill — GD rule. A player standing on the block's top (bottom
    // within landing tolerance of the top) is safe — that's a landing.
    for (const p of platforms) {
      if (p.kind !== "block") continue;
      if (overlap(player, p) && player.y + player.h > p.y + 8) {
        if (_onHurt) _onHurt();
        return;
      }
    }
  }

  // Jump: fixed-height (GD). Fires on ground contact while the jump input is
  // held — holding the button auto-re-jumps on every landing. Coyote + buffer
  // keep it forgiving.
  function updateJump(dt) {
    if (player.onGround && (keys.jump || player.jumpBuffer > 0)) {
      player.vy = -JUMP_V;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.onGround = false;
      sfx.jump();
      dust(player.x + player.w / 2, player.y + player.h, 5);
    }
  }

  // Vertical movement + Y collision with sub-stepping to prevent tunneling.
  // GD rule: landing on a block's top is safe; hitting a block from the side
  // or underside is death. Ground segments stay safe everywhere.
  function updateVertical(dt) {
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
          } else if (p.kind === "block") {
            // GD rule: hitting a block from the side or underside is death.
            if (_onHurt) _onHurt();
            return;
          } else {
            player.y = p.y + p.h;
            player.vy = 0;
          }
        }
      }
      if (player.vy === 0) break;
    }
  }

  // Coins: collectible circle-rect collision.
  function updateCoins() {
    const gs = gameState;
    for (const c of coins) {
      if (!c.taken && circleRect(c.x, c.y, c.r, player)) {
        c.taken = true;
        gs.score += 10;
        gs.coinCount++;
        sfx.coin();
        sparkle(c.x, c.y);
      }
    }
  }

  // Jump orbs (GD-style): tap while airborne and overlapping an unused orb to
  // get an immediate mid-air re-jump. One-shot; consumed on use. Fires on the
  // tap edge (jumpBuffer > 0) only — holding alone never triggers it, and a
  // ground tap was already consumed by updateJump (buffer zeroed there).
  // Runs AFTER updateVertical so the re-jump velocity is exactly -JUMP_V on
  // the frame it fires (gravity applies next frame, like the harness asserts).
  function updateOrbs() {
    if (player.onGround || player.jumpBuffer <= 0) return;
    for (const o of orbs) {
      if (o.used) continue;
      if (circleRect(o.x, o.y, o.r, player)) {
        o.used = true;
        player.jumpBuffer = 0;
        player.vy = -JUMP_V;
        player.coyote = 0;
        sfx.jump();
        dust(player.x + player.w / 2, player.y + player.h, 5);
        break;
      }
    }
  }

  // Spikes: instant hurt on contact.
  function updateSpikes() {
    if (player.invuln <= 0) {
      for (const s of spikes) {
        if (overlap(player, s)) { if (_onHurt) _onHurt(); break; }
      }
    }
  }

  // Boundaries: fell into a pit, or reached the end of the level (100%).
  function updateBoundaries() {
    if (player.y > H + 80 && _onHurt) _onHurt(true);
    if (player.x + player.w >= gameState.levelW && _onWin) _onWin();
  }

  // Cube spin: spins in the air (~2 rev/s), snaps to the nearest 90° on landing.
  function updateRunAnim(dt) {
    if (player.onGround) {
      player.angle = Math.round(player.angle / 90) * 90;
    } else {
      player.angle = (player.angle + dt * 720) % 360;
    }
  }

  // --- Main update: runs all systems in order ---
  function update(dt) {
    updateTimers(dt);

    // Death sequence: the player freezes and flashes in place, then the
    // respawn is resolved via the callback (life deduction happens there).
    if (gameState.dying > 0) {
      gameState.dying -= dt;
      if (gameState.dying <= 0 && _onHurtResolve) {
        gameState.dying = 0;
        _onHurtResolve();
      }
      return; // nothing else runs during the death beat
    }

    updateMovement(dt);
    player.trailT -= dt;
    if (player.trailT <= 0) {
      player.trailT = 0.03;
      trail(player.x + 4, player.y + player.h / 2, gameState.theme.trail);
    }
    updateJump(dt);
    updateVertical(dt);
    updateOrbs();
    updateRunAnim(dt);
    updateCoins();
    updateSpikes();
    updateBoundaries();
  }

  function updateCamera() {
    const target = player.x + player.w / 2 - W * 0.4;
    gameState.camera.x = Math.max(0, Math.min(target, gameState.levelW - W));
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      if (p.t >= p.life) { particles.splice(i, 1); continue; }
      if (!p.noGravity) p.vy += 500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
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
    gameState.checkpoint.x = 80;
    gameState.checkpoint.y = GROUND_Y - 46;
    gameState.camera.x = 0;
    gameState.dying = 0;
  }

  return {
    GRAV, AUTO_SPEED, JUMP_V, MAX_FALL, COYOTE, BUFFER, TILE,
    player, gameState,
    overlap, circleRect, fmtTime,
    particles, sparkle, burst, dust, trail, confetti,
    updateParticles, update, updateCamera, resetPlayer,
    setCallbacks,
  };
})();