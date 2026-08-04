// OpenCode — Levels (level data, builders, themes, constants)
// Depends on: nothing — it's pure data + helper functions.
// The scene arrays (platforms, coins, enemies, etc.) are populated by calling
// build() on a level, which uses the helper functions below.
// Exposes: LEVELS, THEMES, constants, scene arrays, data helpers

const Levels = (() => {
  "use strict";

  const W = 960;
  const H = 540;
  const GROUND_H = 60;
  const GROUND_Y = H - GROUND_H;
  const LEVEL_MAX_W = 6400;

  // Scene arrays (populated by loadLevel in game.js).
  const platforms = [];
  const coins = [];
  const enemies = [];
  const projectiles = [];
  const spikes = [];
  const keyItems = [];
  const gates = [];
  const flag = { x: 0 };

  // --- Level builder helpers ---
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
  const shooter = (x, min, max, interval = 2.4, boltSpeed = 310, cooldown = 1.3) =>
    enemies.push({
      x,
      y: GROUND_Y - 34,
      w: 40,
      h: 34,
      min,
      max,
      dir: 1,
      speed: 0,
      alive: true,
      kind: "shooter",
      interval,
      boltSpeed,
      cooldown,
      aim: 0,
    });
  const spike = (x, w = 48) => spikes.push({ x, y: GROUND_Y - 16, w, h: 16 });
  const key = (x, y, label) => keyItems.push({ x, y, r: 12, label, taken: false });
  const gate = (x, h, label) => gates.push({ x, y: GROUND_Y - h, w: 14, h, label, opened: false, opening: 0 });
  const coinArc = (cx, cy, n) => {
    for (let i = 0; i < n; i++) coin(cx + i * 34, cy - Math.sin((i / (n - 1)) * Math.PI) * 46);
  };

  // --- Themes ---
  // Base theme with shared defaults; per-level themes override the palette.
  const THEME_BASE = {
    star: "#cbd5e1",
    moon: "#e2e8f0",
    hillA: "#1a2342",
    hillB: "#141b33",
    groundTop: "#1f2a44",
    groundBody: "#33455f",
    groundGlow: "rgba(34,211,238,0.18)",
    platBody: "#0d9488",
    platTop: "#5eead4",
    flag: "#38bdf8",
    gate: "#e879f9",
  };
  const THEMES = {
    1: {
      ...THEME_BASE,
      sky: ["#0b1020", "#16224a", "#1e2f5c"],
      groundEdge: "#22d3ee",
    },
    2: {
      ...THEME_BASE,
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
    },
    3: {
      ...THEME_BASE,
      sky: ["#0c4a6e", "#0284c7", "#38bdf8"],
      star: "#e0f2fe",
      moon: "#ffffff",
      hillA: "#134e4a",
      hillB: "#115e59",
      groundTop: "#0f3d3a",
      groundBody: "#115e59",
      groundEdge: "#5eead4",
      groundGlow: "rgba(45,212,191,0.22)",
      platBody: "#0d9488",
      platTop: "#99f6e4",
      flag: "#fbbf24",
    },
  };

  // --- Level definitions ---
  const LEVELS = {
    1: {
      name: "Neon Meadows",
      width: 5120,
      flagX: 4860,
      checkpoints: [500, 1000, 1500, 2100, 2700, 3300, 4000, 4700],
      build() {
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
        shooter(1680, 1590, 1820, 2.6, 320);
        flyer(1910, 1905, 1995, 390, 40, 2.0, 0);

        ground(2000, 400);
        spike(2100, 44);
        enemy(2160, 2050, 2340, 100);
        coin(2280, 430);

        ground(2520, 300);
        plat(2530, 350, 90);
        key(2575, 330, "A");
        flyer(2545, 2530, 2620, 300, 35, 1.6, 2);
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
        flyer(3490, 3470, 3570, 320, 35, 1.7, 4);
        shooter(3490, 3410, 3580, 2.4, 300);
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
    3: {
      name: "Sunflare Ridge",
      width: 6200,
      flagX: 6060,
      checkpoints: [500, 1150, 1800, 2450, 3100, 3700, 4300, 4900, 5500],
      build() {
        // Start: first darter teaches dash-and-dodge (darter added in Task 2).
        ground(0, 720);
        coinArc(640, 440, 3);

        // First high platforms; the life heart sits on the second one.
        plat(800, 420, 130);
        coinArc(840, 400, 3);
        plat(1080, 330, 110);
        ground(1150, 420);
        coinArc(1260, 400, 3);

        // Gate A.
        ground(1650, 520);
        spike(1750, 50);
        coinArc(1700, 440, 3);
        coin(2060, 440);
        key(2100, 380, "A");
        gate(2140, 320, "A");

        ground(2300, 460);
        plat(2380, 360, 120);
        coinArc(2390, 340, 3);
        spike(2500, 50);

        ground(2880, 420);
        coinArc(3060, 440, 3);
        plat(3140, 380, 110);
        coinArc(3150, 360, 3);
        spike(3240, 50);

        // Gate B.
        ground(3440, 440);
        coin(3720, 440);
        key(3760, 380, "B");
        gate(3800, 320, "B");

        ground(3980, 460);
        plat(4060, 380, 110);
        coinArc(4070, 360, 3);
        spike(4200, 50);

        ground(4580, 420);
        coinArc(4740, 440, 3);
        plat(4840, 370, 110);
        coinArc(4850, 350, 3);
        spike(4940, 50);

        ground(5160, 460);
        coinArc(5240, 440, 4);

        ground(5760, 440);
        coinArc(5840, 440, 3);
        coinArc(5940, 400, 3);
      },
    },
  };

  // --- Deterministic procedural generation ---
  // Simple LCG seeded PRNG so the starfield and clouds are always the same
  // without relying on opaque magic-number patterns.
  // Uses a running state so each call advances the sequence.
  function makeSeededRand(seed) {
    let s = seed;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  const stars = [];
  const rngStar = makeSeededRand(42);
  for (let i = 0; i < 70; i++) {
    stars.push({
      x: rngStar() * LEVEL_MAX_W,
      y: rngStar() * 240,
      r: rngStar() * 2.3 + 0.7,
    });
  }
  const clouds = [];
  const rngCloud = makeSeededRand(17);
  for (let i = 0; i < 8; i++) {
    clouds.push({
      x: i * 700 + rngCloud() * 400,
      y: 50 + rngCloud() * 140,
      s: 0.7 + rngCloud() * 0.8,
    });
  }

  function clearScene() {
    platforms.length = 0;
    coins.length = 0;
    enemies.length = 0;
    projectiles.length = 0;
    spikes.length = 0;
    keyItems.length = 0;
    gates.length = 0;
  }

  return {
    GROUND_H, GROUND_Y, LEVEL_MAX_W, W, H,
    platforms, coins, enemies, projectiles, spikes, keyItems, gates, flag,
    stars, clouds,
    THEMES, LEVELS,
    clearScene, coinArc,
  };
})();