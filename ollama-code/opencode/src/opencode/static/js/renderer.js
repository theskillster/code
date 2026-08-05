// OpenCode — Renderer (all draw functions)
// Depends on: Levels (for scene arrays, themes, stars, clouds, constants), Entities (for player, particles, gameState)
// Exposes: draw(), updateHUD()

import { Levels } from "./levels.js";
import { Entities } from "./entities.js";

export const Renderer = (() => {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const W = 960;
  const H = 540;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const {
    GROUND_H, GROUND_Y,
    platforms, coins, spikes, flag,
    stars, clouds,
    THEMES,
  } = Levels;

  const { player, gameState, particles, overlap } = Entities;

  // --- DOM references ---
  const $ = (id) => document.getElementById(id);
  const els = {
    overlay: $("game-overlay"),
    overlayTitle: $("overlay-title"),
    overlayText: $("overlay-text"),
    overlayBtn: $("btn-start"),
    btnSound: $("btn-sound"),
    btnPause: $("btn-pause"),
    hudCoins: $("hud-coins"),
    hudAttempts: $("hud-attempts"),
    hudBest: $("hud-best"),
    hudProgress: $("hud-progress"),
    levelBadge: $("level-name-badge"),
  };

  // --- Round-rect helper ---
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

  // --- Background ---
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, gameState.theme.sky[0]);
    g.addColorStop(0.7, gameState.theme.sky[1]);
    g.addColorStop(1, gameState.theme.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Stars (parallax 0.15).
    ctx.fillStyle = gameState.theme.star;
    for (const s of stars) {
      const sx = ((s.x - gameState.camera.x * 0.15) % W + W) % W;
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(gameState.animTime * 2 + s.x);
      ctx.beginPath();
      ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Moon glow.
    const moonX = W - 110 - gameState.camera.x * 0.05;
    const moonY = 84;
    const glow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 90);
    glow.addColorStop(0, "rgba(226,232,240,0.28)");
    glow.addColorStop(1, "rgba(226,232,240,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(moonX - 90, moonY - 90, 180, 180);
    ctx.fillStyle = gameState.theme.moon;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = gameState.theme.star;
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cloud layers (parallax).
    ctx.fillStyle = "rgba(148,163,184,0.14)";
    for (const c of clouds) {
      const cx = ((c.x - gameState.camera.x * 0.35) % (W + 200) + W + 200) % (W + 200) - 100;
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
    hill(gameState.camera.x * 0.25, 420, 130, 260, gameState.theme.hillA);
    hill(gameState.camera.x * 0.45, 452, 90, 200, gameState.theme.hillB);
  }

  // --- Platforms ---
  function drawPlatforms() {
    for (const p of platforms) {
      if (p.kind === "ground") {
        ctx.fillStyle = gameState.theme.groundTop;
        ctx.fillRect(p.x, p.y + 6, p.w, p.h - 6);
        ctx.fillStyle = gameState.theme.groundBody;
        ctx.fillRect(p.x, p.y + 10, p.w, p.h - 14);
        ctx.fillStyle = gameState.theme.groundEdge;
        ctx.fillRect(p.x, p.y, p.w, 5);
        ctx.fillStyle = gameState.theme.groundGlow;
        ctx.fillRect(p.x, p.y + 5, p.w, 8);
      } else if (p.kind === "plat") {
        ctx.fillStyle = gameState.theme.platBody;
        roundRect(p.x, p.y, p.w, p.h, 8);
        ctx.fill();
        ctx.fillStyle = gameState.theme.platTop;
        ctx.fillRect(p.x + 5, p.y + 2, p.w - 10, 5);
      }
    }
  }

  // --- Spikes ---
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

  // --- Blocks: neon square tiles (GD-style) ---
  function drawBlocks() {
    for (const b of platforms) {
      if (b.kind !== "block") continue;
      ctx.fillStyle = gameState.theme.blockBody;
      ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
      ctx.strokeStyle = gameState.theme.blockEdge;
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(b.x + 7, b.y + 7, b.w - 14, b.h - 14);
    }
  }

  // --- Coins ---
  function drawCoins() {
    for (const c of coins) {
      if (c.taken) continue;
      const pulse = 1 + Math.sin(gameState.animTime * 5 + c.x * 0.1) * 0.08;
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

  // --- Player ---
  function drawPlayer() {
    // Fast strobe while dying; slow blink while invulnerable after respawn.
    const dying = gameState.dying > 0;
    const blink = dying
      ? Math.floor((0.65 - gameState.dying) * 20) % 2 === 0
      : player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = blink ? 0.15 : 1;
    ctx.translate(player.x + player.w / 2, player.y + player.h);
    ctx.scale(player.facing, 1);
    const str = player.onGround && Math.abs(player.vx) > 0 ? Math.sin(player.run || 0) * 6 : 0;
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

  // --- Particles ---
  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // --- Main draw ---
  function draw() {
    drawBackground();

    ctx.save();
    ctx.translate(-gameState.camera.x, 0);

    drawPlatforms();
    drawBlocks();
    drawSpikes();
    drawCoins();
    drawParticles();
    if (gameState.state !== "over") drawPlayer();

    ctx.restore();

    // Subtle vignette for depth.
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(2,6,23,0.5)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  // --- HUD ---
  function updateHUD() {
    els.hudCoins.textContent = `${gameState.coinCount}/${gameState.totalCoins}`;
    els.hudAttempts.textContent = gameState.attempts;
    els.hudBest.textContent = gameState.best ? gameState.best + "%" : "\u2014";
    const pct = Math.max(0, Math.min(100, (player.x / gameState.levelW) * 100));
    els.hudProgress.style.width = pct.toFixed(1) + "%";
    els.levelBadge.textContent = Levels.LEVELS[gameState.currentLevel].name;
  }

  return { draw, updateHUD, els, ctx, canvas, W, H, roundRect };
})();