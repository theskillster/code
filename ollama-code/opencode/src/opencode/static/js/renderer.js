// OpenCode — Renderer (all draw functions)
// Depends on: Levels (for scene arrays, themes, stars, clouds, constants), Entities (for player, particles, gameState)
// Exposes: draw(), updateHUD()

const Renderer = (() => {
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
    platforms, coins, enemies, projectiles, spikes, keyItems, gates, lifePickups, flag,
    stars, clouds,
    THEMES,
  } = Levels;

  const { player, gameState, particles, overlap, fmtTime } = Entities;

  // --- DOM references ---
  const $ = (id) => document.getElementById(id);
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
      } else {
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

  // --- Gates ---
  function drawGates() {
    for (const g of gates) {
      if (g.opened && g.opening >= 1) continue;
      ctx.save();
      const rise = g.opening * g.h;
      ctx.globalAlpha = 1 - g.opening * 0.85;
      ctx.translate(0, -rise);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(g.x + 2, g.y, g.w - 4, g.h);
      ctx.fillStyle = gameState.theme.gate;
      ctx.fillRect(g.x + 3, g.y, 3, g.h);
      ctx.fillRect(g.x + g.w - 6, g.y, 3, g.h);
      ctx.fillStyle = "rgba(240,171,252,0.4)";
      for (let i = 0; i < g.h; i += 22) ctx.fillRect(g.x, g.y + i, g.w, 2);
      if (!g.opened) {
        const px = g.x + g.w / 2, py = g.y + g.h * 0.48;
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(px - 5, py - 5, 10, 9);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py - 6, 4.5, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(px - 1.5, py + 0.5, 3, 3);
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 17px system-ui";
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.55 + 0.35 * Math.sin(gameState.animTime * 4);
        ctx.fillText("🔑", px, g.y - 12);
      }
      ctx.restore();
    }
  }

  // --- Keys ---
  function drawKeys() {
    for (const k of keyItems) {
      if (k.taken) continue;
      const bob = Math.sin(gameState.animTime * 3 + k.x) * 3;
      const pulse = 1 + Math.sin(gameState.animTime * 5 + k.x * 0.1) * 0.1;
      const ky = k.y + bob;
      ctx.fillStyle = "rgba(251,191,36,0.22)";
      ctx.beginPath();
      ctx.arc(k.x, ky, 17 * pulse, 0, Math.PI * 2);
      ctx.fill();
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

  // --- Life heart pickups ---
  function drawLifePickups() {
    for (const li of lifePickups) {
      if (li.taken) continue;
      const bob = Math.sin(gameState.animTime * 3 + li.x) * 3;
      const pulse = 1 + Math.sin(gameState.animTime * 5 + li.x * 0.1) * 0.12;
      const ly = li.y + bob;
      ctx.fillStyle = "rgba(244,63,94,0.22)";
      ctx.beginPath();
      ctx.arc(li.x, ly, 19 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(li.x, ly);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(-6, -3, 7, 0, Math.PI * 2);
      ctx.arc(6, -3, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fb7185";
      ctx.beginPath();
      ctx.moveTo(-12.5, -1);
      ctx.lineTo(0, 13);
      ctx.lineTo(12.5, -1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fecdd3";
      ctx.beginPath();
      ctx.arc(-2.5, -5, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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

  // --- Flag ---
  function drawFlag() {
    const fx = flag.x;
    const wave = Math.sin(gameState.animTime * 4) * 4;
    ctx.fillStyle = "#64748b";
    ctx.fillRect(fx + 3, GROUND_Y - 8, 24, 8);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(fx + 13, GROUND_Y - 118, 5, 112);
    ctx.fillStyle = gameState.theme.flag;
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

  // --- Enemy sprites ---
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
    const z = Math.sin(gameState.animTime * 20 + e.x) * 2;
    ctx.fillStyle = "rgba(232,121,249,0.18)";
    ctx.beginPath();
    ctx.arc(0, z, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d946ef";
    roundRect(-13, -14 + z, 26, 28, 12);
    ctx.fill();
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
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-8, -6 + z, 5, 6);
    ctx.fillRect(3, -6 + z, 5, 6);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-6.5, -5 + z, 2.5, 3);
    ctx.fillRect(4.5, -5 + z, 2.5, 3);
    ctx.restore();
  }

  function drawShooter(e) {
    const a = e.aim || 0;
    const ready = e.cooldown <= 0.28;
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = "#9f1239";
    roundRect(4, -4.5, 22, 9, 4);
    ctx.fill();
    ctx.fillStyle = ready ? "#fda4af" : "#fb7185";
    ctx.beginPath();
    ctx.arc(27, 0, ready ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(244,63,94,0.16)";
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#be123c";
    roundRect(-15, -12, 30, 22, 10);
    ctx.fill();
    ctx.fillStyle = "#fb7185";
    roundRect(-11, -8, 22, 7, 4);
    ctx.fill();
    ctx.fillStyle = "#fff1f2";
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawDarter(e) {
    const charging = e.state === "windup";
    const dashing = e.state === "dash";
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.scale(e.dir, 1);
    // Motion streak while dashing.
    if (dashing) {
      ctx.fillStyle = "rgba(16,185,129,0.25)";
      roundRect(-34, -12, 30, 22, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(16,185,129,0.4)";
      roundRect(-26, -10, 20, 18, 6);
      ctx.fill();
    }
    ctx.fillStyle = "#065f46";
    roundRect(-15, -13, 30, 24, 10);
    ctx.fill();
    // Teardrop beak points the way it's about to dash.
    ctx.fillStyle = charging ? "#fbbf24" : "#10b981";
    ctx.beginPath();
    ctx.moveTo(12, -8);
    ctx.lineTo(22, 0);
    ctx.lineTo(12, 8);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();
    // Eyes.
    ctx.fillStyle = "#ecfdf5";
    ctx.fillRect(-9, -8, 6, 6);
    ctx.fillRect(-1, -8, 6, 6);
    ctx.fillStyle = "#022c22";
    ctx.fillRect(-7, -7, 3, 4);
    ctx.fillRect(1, -7, 3, 4);
    // Amber charge-up ring telegraph.
    if (charging) {
      const p = 0.5 + 0.5 * Math.sin(gameState.animTime * 18);
      ctx.fillStyle = `rgba(251,191,36,${0.25 + p * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + p * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    if (e.kind === "flyer") drawFlyer(e);
    else if (e.kind === "shooter") drawShooter(e);
    else if (e.kind === "darter") drawDarter(e);
    else drawWalker(e);
  }

  // --- Projectiles ---
  function drawProjectile(p) {
    const pulse = 1 + Math.sin(gameState.animTime * 20 + p.t * 26) * 0.18;
    ctx.strokeStyle = "rgba(244,63,94,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.fillStyle = "rgba(244,63,94,0.22)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 2.1 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fecdd3";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * pulse * 0.45, 0, Math.PI * 2);
    ctx.fill();
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
    drawSpikes();
    drawGates();
    drawCoins();
    drawKeys();
    drawLifePickups();
    drawFlag();
    for (const e of enemies) if (e.alive) drawEnemy(e);
    for (const p of projectiles) drawProjectile(p);
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
    els.hudScore.textContent = gameState.score;
    els.hudCoins.textContent = `${gameState.coinCount}/${gameState.totalCoins}`;
    els.hudLives.textContent = "\u2665".repeat(Math.max(0, gameState.lives)) + "\u2661".repeat(Math.max(0, 3 - gameState.lives));
    els.hudBest.textContent = gameState.best ? gameState.best : "\u2014";
    els.hudTime.textContent = fmtTime(gameState.time);
    els.hudLevel.textContent = gameState.currentLevel;
    els.hudKey.textContent = gameState.keyCount > 0 ? "\uD83D\uDD11" : "\uD83D\uDD12";
    els.levelBadge.textContent = Levels.LEVELS[gameState.currentLevel].name;
  }

  return { draw, updateHUD, els, ctx, canvas, W, H, roundRect };
})();