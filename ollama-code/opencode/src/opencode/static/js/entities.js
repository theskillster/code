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
    platforms, coins, enemies, projectiles, spikes, keyItems, gates, lifePickups, flag,
    LEVELS, THEMES, LEVEL_MAX_W,
  } = Levels;

  // --- Physics constants ---
  const GRAV = 2300;
  const MOVE = 340;
  const JUMP_V = 800;
  const MAX_FALL = 1300;
  const COYOTE = 0.09;
  const BUFFER = 0.12;

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
    coyote: 0,
    jumpBuffer: 0,
    invuln: 0,
    run: 0,
  };

  // --- Shared game state (mutated by both entities.js and game.js) ---
  const gameState = {
    state: "menu",
    score: 0,
    coinCount: 0,
    keyCount: 0,
    lives: 3,
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
    // before the life is actually deducted and they respawn.
    dying: 0,
  };

  // Callbacks for side effects (set by game.js during init).
  let _onHurt = null;
  let _onWin = null;
  let _onGameOver = null;
  let _onHurtResolve = null;

  function setCallbacks(onHurt, onWin, onGameOver, onHurtResolve) {
    _onHurt = onHurt;
    _onWin = onWin;
    _onGameOver = onGameOver;
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

  // Horizontal movement + X collision with platforms.
  function updateMovement(dt) {
    const gs = gameState;
    player.vx = 0;
    if (keys.left) player.vx = -MOVE;
    if (keys.right) player.vx = MOVE;
    if (player.vx !== 0) player.facing = player.vx > 0 ? 1 : -1;
    player.x += player.vx * dt;
    player.x = Math.max(0, Math.min(player.x, gs.levelW - player.w));
    for (const p of platforms) {
      if (overlap(player, p)) {
        if (player.vx > 0) player.x = p.x - player.w;
        else if (player.vx < 0) player.x = p.x + p.w;
        player.vx = 0;
      }
    }
  }

  // Jump: coyote-time + input-buffer check, fires if both are active.
  function updateJump(dt) {
    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -JUMP_V;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.onGround = false;
      sfx.jump();
      dust(player.x + player.w / 2, player.y + player.h, 5);
    }
  }

  // Vertical movement + Y collision with sub-stepping to prevent tunneling.
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
  }

  // Gates: solid walls until their key unlocks them.
  function updateGates(dt) {
    for (const g of gates) {
      if (g.opened) continue;
      if (overlap(player, g)) {
        const mid = player.x + player.w / 2;
        if (mid < g.x + g.w / 2) player.x = g.x - player.w;
        else player.x = g.x + g.w;
        player.vx = 0;
      }
    }
    // Gate opening animation.
    for (const g of gates) {
      if (g.opened && g.opening < 1) g.opening = Math.min(1, g.opening + dt * 2.2);
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

  // Keys: collectible, unlock matching gates.
  function updateKeys() {
    const gs = gameState;
    for (const k of keyItems) {
      if (!k.taken && circleRect(k.x, k.y, k.r, player)) {
        k.taken = true;
        gs.score += 100;
        gs.keyCount++;
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
  }

  // Life hearts: +1 life (capped at 6 so the HUD stays sane).
  function updateLives() {
    const gs = gameState;
    for (const li of lifePickups) {
      if (!li.taken && circleRect(li.x, li.y, li.r, player)) {
        li.taken = true;
        gs.score += 50;
        if (gs.lives < 6) {
          gs.lives++;
          sfx.life();
          sparkle(li.x, li.y);
          burst(li.x, li.y, 12);
        }
      }
    }
  }

  // Enemies: patrol, flyer bob, shooter aim/fire, stomp detection.
  function updateEnemies(dt) {
    const gs = gameState;
    for (const e of enemies) {
      if (!e.alive) continue;
      e.x += e.dir * e.speed * dt;
      if (e.x <= e.min) { e.x = e.min; e.dir = 1; }
      if (e.x + e.w >= e.max) { e.x = e.max - e.w; e.dir = -1; }
      if (e.kind === "flyer") {
        e.y = e.baseY + Math.sin(gs.animTime * e.bobSpeed + e.phase) * e.amp;
      } else if (e.kind === "shooter") {
        e.cooldown -= dt;
        const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
        const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
        e.aim = Math.atan2(pcy - ecy, pcx - ecx);
        if (Math.abs(pcx - ecx) < 760 && Math.abs(pcy - ecy) < 280 && e.cooldown <= 0) {
          e.cooldown = e.interval;
          const bx = ecx + Math.cos(e.aim) * 28, by = ecy + Math.sin(e.aim) * 28;
          projectiles.push({ x: bx, y: by, vx: Math.cos(e.aim) * e.boltSpeed, vy: Math.sin(e.aim) * e.boltSpeed, r: 7, life: 2.6, t: 0 });
          sfx.shoot();
          burst(bx, by, 3);
        }
      }
      if (e.kind === "darter") {
        // State machine: wait -> windup (amber telegraph) -> dash -> wait.
        const ecx = e.x + e.w / 2;
        const pcx = player.x + player.w / 2;
        if (e.state === "wait") {
          // Only act when the player is near: face them and wind up the
          // dash timer. Idle darters far away never waste a dash.
          if (Math.abs(pcx - ecx) < 520) {
            e.dir = pcx >= ecx ? 1 : -1;
            e.timer -= dt;
            if (e.timer <= 0) { e.state = "windup"; e.timer = 0.3; }
          }
        } else if (e.state === "windup") {
          e.timer -= dt;
          if (e.timer <= 0) { e.state = "dash"; e.timer = e.dashDist; }
        } else {
          const move = e.dir * e.dashSpeed * dt;
          const nx = Math.max(e.min, Math.min(e.max - e.w, e.x + move));
          if (nx === e.x) { e.state = "wait"; e.timer = e.waitTime; }
          else {
            e.timer -= Math.abs(move);
            e.x = nx;
            if (e.timer <= 0) { e.state = "wait"; e.timer = e.waitTime; }
          }
        }
        if (player.invuln > 0) continue;
        if (overlap(player, e)) {
          // Stompable only while waiting — a dashing darter always hurts.
          const stompable = e.state === "wait";
          const stomping = player.vy > 120 && player.y + player.h - e.y < e.h * 0.7;
          if (stompable && stomping) {
            e.alive = false;
            player.vy = -JUMP_V * 0.62;
            gs.score += 50;
            sfx.stomp();
            burst(e.x + e.w / 2, e.y + e.h / 2, 12);
          } else {
            if (_onHurt) _onHurt();
          }
        }
        continue;
      }
      if (player.invuln > 0) continue;
      if (overlap(player, e)) {
        const stomping = player.vy > 120 && player.y + player.h - e.y < e.h * 0.7;
        if (stomping) {
          e.alive = false;
          player.vy = -JUMP_V * 0.62;
          gs.score += 50;
          sfx.stomp();
          burst(e.x + e.w / 2, e.y + e.h / 2, 12);
        } else {
          if (_onHurt) _onHurt();
        }
      }
    }
  }

  // Projectiles: shooter bolts — fly, bounce off walls, hurt on contact.
  function updateProjectiles(dt) {
    const gs = gameState;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      let dead = p.t >= p.life || p.x < -40 || p.x > gs.levelW + 40 || p.y < -40 || p.y > H + 40;
      if (!dead) {
        const pr = { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 };
        for (const pl of platforms) { if (overlap(pr, pl)) { dead = true; break; } }
        if (!dead) { for (const g of gates) { if (!g.opened && overlap(pr, g)) { dead = true; break; } } }
      }
      if (!dead && player.invuln <= 0 && circleRect(p.x, p.y, p.r, player)) {
        const stomping = player.vy > 120 && player.y + player.h < p.y + p.r + 6;
        if (stomping) {
          player.vy = -JUMP_V * 0.45;
          gs.score += 10;
          sfx.stomp();
        } else {
          if (_onHurt) _onHurt();
        }
        dead = true;
      }
      if (dead) { burst(p.x, p.y, 5); projectiles.splice(i, 1); }
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

  // Boundaries: fell into a pit or reached the flag.
  function updateBoundaries() {
    if (player.y > H + 80 && _onHurt) _onHurt(true);
    if (player.x + player.w > flag.x && player.y + player.h > GROUND_Y - 40 && _onWin) _onWin();
  }

  // Checkpoints: update respawn point when player passes a milestone.
  function updateCheckpoints() {
    const gs = gameState;
    for (const t of gs.CHECKPOINTS) {
      if (player.x > t && player.onGround && t > gs.checkpoint.x) {
        gs.checkpoint.x = t;
        gs.checkpoint.y = GROUND_Y - player.h;
      }
    }
  }

  // Run animation counter.
  function updateRunAnim(dt) {
    if (player.onGround && Math.abs(player.vx) > 0) player.run += dt * 12;
    else player.run += dt * 4;
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
    updateJump(dt);
    updateVertical(dt);
    updateGates(dt);
    updateRunAnim(dt);
    updateCoins();
    updateKeys();
    updateLives();
    updateEnemies(dt);
    updateProjectiles(dt);
    updateSpikes();
    updateBoundaries();
    updateCheckpoints();
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
      p.vy += 500 * dt;
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
    GRAV, MOVE, JUMP_V, MAX_FALL, COYOTE, BUFFER,
    player, gameState,
    overlap, circleRect, fmtTime,
    particles, sparkle, burst, dust, confetti,
    updateParticles, update, updateCamera, resetPlayer,
    setCallbacks,
  };
})();