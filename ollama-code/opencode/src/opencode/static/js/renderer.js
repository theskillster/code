// OpenCode — Renderer (all draw functions)
// Depends on: Levels (for scene arrays, themes, stars, clouds, constants), Entities (for player, particles, gameState)
// Exposes: draw(), updateHUD()

import { Audio } from "./audio.js";
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
    platforms, coins, spikes, THEMES,
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

  // --- Background: deep neon gradient + beat-synced glow + scrolling grid ---
  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, gameState.theme.sky[0]);
    g.addColorStop(0.7, gameState.theme.sky[1]);
    g.addColorStop(1, gameState.theme.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Beat pulse: background glow swells on the beat of the current track.
    const bpm = Audio.getBpm();
    const beat = (gameState.animTime * bpm) / 60;
    const phase = beat - Math.floor(beat);
    const pulse = phase < 0.25 ? 1 + 0.18 * (1 - phase / 0.25) : 1;
    ctx.globalAlpha = 0.10 * pulse;
    ctx.fillStyle = gameState.theme.glow;
    ctx.fillRect(0, H - 220, W, 220);
    ctx.globalAlpha = 1;

    // Scrolling vertical grid lines (parallax with the auto-run).
    ctx.strokeStyle = "rgba(148,163,184,0.10)";
    ctx.lineWidth = 1;
    const tile = Levels.TILE;
    const off = -((gameState.camera.x * 0.6) % tile);
    for (let x = off; x < W; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  }

  // --- Platforms ---
  function drawPlatforms() {
    for (const p of platforms) {
      if (p.kind === "ground") {
        ctx.fillStyle = gameState.theme.groundBody;
        ctx.fillRect(p.x, p.y + 6, p.w, p.h - 6);
        ctx.fillStyle = gameState.theme.groundTop;
        ctx.fillRect(p.x, p.y, p.w, 6);
        ctx.strokeStyle = "rgba(148,163,184,0.25)";
        ctx.lineWidth = 1;
        for (let gx = p.x - (p.x % 48); gx < p.x + p.w; gx += 48) {
          ctx.beginPath();
          ctx.moveTo(gx, p.y);
          ctx.lineTo(gx, p.y + p.h);
          ctx.stroke();
        }
      } else if (p.kind === "plat") {
        ctx.fillStyle = gameState.theme.platBody;
        roundRect(p.x, p.y, p.w, p.h, 8);
        ctx.fill();
        ctx.fillStyle = gameState.theme.platTop;
        ctx.fillRect(p.x + 5, p.y + 2, p.w - 10, 5);
      }
    }
  }

  // --- Spikes: neon triangles with glow ---
  function drawSpikes() {
    for (const s of spikes) {
      ctx.shadowColor = gameState.theme.spike;
      ctx.shadowBlur = 10;
      ctx.fillStyle = gameState.theme.spike;
      const n = Math.floor(s.w / 14);
      for (let i = 0; i < n; i++) {
        const x0 = s.x + i * 14;
        ctx.beginPath();
        ctx.moveTo(x0, s.y + s.h);
        ctx.lineTo(x0 + 7, s.y);
        ctx.lineTo(x0 + 14, s.y + s.h);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
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

  // --- Player: spinning neon cube (GD-style) ---
  function drawPlayer() {
    const col = gameState.theme.cube;
    const inner = gameState.theme.cubeInner;
    const size = 40;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const dying = gameState.dying > 0;
    // Fast strobe while dying.
    if (dying) {
      ctx.globalAlpha = Math.floor(gameState.dying * 20) % 2 === 0 ? 0.2 : 1;
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((player.angle * Math.PI) / 180);
    ctx.shadowColor = col;
    ctx.shadowBlur = 18;
    ctx.fillStyle = col;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.shadowBlur = 0;
    ctx.fillStyle = inner;
    ctx.fillRect(-size / 2 + 5, -size / 2 + 5, size - 10, size - 10);
    ctx.fillStyle = col;
    ctx.fillRect(-size / 2 + 8, -size / 2 + 8, size - 16, size - 16);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-size / 2 + 1, -size / 2 + 1, size - 2, size - 2);
    ctx.restore();
    ctx.globalAlpha = 1;
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