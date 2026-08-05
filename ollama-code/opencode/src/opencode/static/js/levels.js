// OpenCode — Levels (level data, builders, themes, constants)
// Depends on: nothing — it's pure data + helper functions.
// The scene arrays (platforms, coins, enemies, etc.) are populated by calling
// build() on a level, which uses the helper functions below.
// Exposes: LEVELS, THEMES, constants, scene arrays, data helpers

export const Levels = (() => {
  "use strict";

  const W = 960;
  const H = 540;
  const GROUND_H = 60;
  const GROUND_Y = H - GROUND_H;
  const LEVEL_MAX_W = 6400;
  const TILE = 48;

  // Scene arrays (populated by loadLevel in game.js).
  const platforms = [];
  const coins = [];
  const spikes = [];
  const flag = { x: 0 };

  // --- Level builder helpers ---
  const ground = (x, w) => platforms.push({ x, y: GROUND_Y, w, h: GROUND_H, kind: "ground" });
  const block = (x, y, w = 48, h = 48) => platforms.push({ x, y, w, h, kind: "block" });
  const coin = (x, y) => coins.push({ x, y, r: 11, taken: false });
  const spike = (x, w = 48) => spikes.push({ x, y: GROUND_Y - 16, w, h: 16 });
  const coinArc = (cx, cy, n) => {
    for (let i = 0; i < n; i++) coin(cx + i * 34, cy - Math.sin((i / (n - 1)) * Math.PI) * 46);
  };

  // --- Themes ---
  // GD neon palettes; per-level themes override the base.
  const THEME_BASE = {
    sky: ["#0a0a14", "#12122a", "#1c1c3c"],
    glow: "#22d3ee",
    groundTop: "#1a1a30",
    groundBody: "#10101f",
    groundEdge: "#22d3ee",
    blockBody: "#16213e",
    blockEdge: "#22d3ee",
    spike: "#f43f5e",
    cube: "#22d3ee",
    cubeInner: "#a5f3fc",
    trail: "#22d3ee",
  };
  const THEMES = {
    1: {
      ...THEME_BASE,
      name: "Neon Meadows",
    },
    2: {
      ...THEME_BASE,
      name: "The Voltage Vault",
      sky: ["#14061f", "#1f0b33", "#2a1145"],
      glow: "#e879f9",
      groundTop: "#241040",
      groundBody: "#150825",
      groundEdge: "#e879f9",
      blockBody: "#2b1246",
      blockEdge: "#e879f9",
      spike: "#f97316",
      cube: "#e879f9",
      cubeInner: "#f5d0fe",
      trail: "#e879f9",
    },
    3: {
      ...THEME_BASE,
      name: "Sunflare Ridge",
      sky: ["#0c1a12", "#12331f", "#16402a"],
      glow: "#4ade80",
      groundTop: "#0f2b1d",
      groundBody: "#0a1f14",
      groundEdge: "#4ade80",
      blockBody: "#123425",
      blockEdge: "#4ade80",
      spike: "#fbbf24",
      cube: "#4ade80",
      cubeInner: "#bbf7d0",
      trail: "#4ade80",
    },
  };

  // --- Level definitions ---
  // GD-style layouts. Ground is continuous (no pits — the floor is the safe
  // zone, like GD), and every hazard sits mid-arc on the hold-cadence landing
  // grid: in-game landings occur at x ≈ 86 + 204k (measured live), so hazards
  // are placed near the midpoint of each arc, clear of both take-off and
  // touchdown. Blocks are jump-over hazards (never landed on): a block whose
  // face the runner clips kills. Levels ramp from singles (1) to doubles (3).
  const LEVELS = {
    1: {
      name: "Neon Meadows",
      width: 4800,
      build() {
        ground(0, 4800);
        spike(392);
        coinArc(420, 400, 3);
        block(596, GROUND_Y - 48);
        coin(620, GROUND_Y - 96);
        spike(800);
        coinArc(830, 400, 3);
        spike(1208);
        coinArc(1240, 400, 3);
        block(1412, GROUND_Y - 48);
        coin(1436, GROUND_Y - 96);
        spike(1616);
        coinArc(1650, 400, 3);
        block(1820, GROUND_Y - 48);
        coin(1844, GROUND_Y - 96);
        spike(2024);
        coinArc(2050, 400, 3);
        block(2228, GROUND_Y - 48);
        coin(2252, GROUND_Y - 96);
        spike(2432);
        coinArc(2470, 400, 3);
        spike(2636);
        coinArc(2670, 400, 3);
        block(2840, GROUND_Y - 48);
        coin(2864, GROUND_Y - 96);
        spike(3044);
        coinArc(3070, 400, 3);
        block(3248, GROUND_Y - 48);
        coin(3272, GROUND_Y - 96);
        spike(3452);
        coinArc(3480, 400, 3);
        block(3656, GROUND_Y - 48);
        coin(3680, GROUND_Y - 96);
        spike(3860);
        coinArc(3890, 400, 3);
        block(4064, GROUND_Y - 48);
        coin(4088, GROUND_Y - 96);
        spike(4268);
        coinArc(4300, 400, 3);
        spike(4472);
        coinArc(4500, 400, 3);
        block(4676, GROUND_Y - 48);
        coin(4700, GROUND_Y - 96);
      },
    },
    2: {
      name: "The Voltage Vault",
      width: 5100,
      build() {
        ground(0, 5100);
        spike(392);
        coinArc(420, 400, 3);
        block(596, GROUND_Y - 48);
        coin(620, GROUND_Y - 96);
        spike(800);
        coinArc(830, 400, 3);
        block(1004, GROUND_Y - 48);
        coin(1028, GROUND_Y - 96);
        spike(1208);
        coinArc(1240, 400, 3);
        block(1412, GROUND_Y - 48);
        coin(1436, GROUND_Y - 96);
        spike(1616);
        coinArc(1650, 400, 3);
        block(1820, GROUND_Y - 48);
        coin(1844, GROUND_Y - 96);
        spike(2024);
        coinArc(2050, 400, 3);
        block(2228, GROUND_Y - 48);
        coin(2252, GROUND_Y - 96);
        spike(2432);
        coinArc(2470, 400, 3);
        block(2636, GROUND_Y - 48);
        coin(2660, GROUND_Y - 96);
        spike(2840);
        coinArc(2870, 400, 3);
        block(3044, GROUND_Y - 48);
        coin(3068, GROUND_Y - 96);
        spike(3248);
        coinArc(3270, 400, 3);
        block(3452, GROUND_Y - 48);
        coin(3476, GROUND_Y - 96);
        spike(3656);
        coinArc(3680, 400, 3);
        block(3860, GROUND_Y - 48);
        coin(3884, GROUND_Y - 96);
        spike(4064);
        coinArc(4090, 400, 3);
        block(4268, GROUND_Y - 48);
        coin(4292, GROUND_Y - 96);
        spike(4472);
        coinArc(4500, 400, 3);
        block(4676, GROUND_Y - 48);
        coin(4700, GROUND_Y - 96);
        spike(4880);
        coinArc(4910, 400, 3);
      },
    },
    3: {
      name: "Sunflare Ridge",
      width: 6200,
      build() {
        ground(0, 6200);
        spike(392);
        coinArc(420, 400, 3);
        block(596, GROUND_Y - 48);
        coin(620, GROUND_Y - 96);
        spike(776);
        spike(824);
        coinArc(880, 400, 3);
        block(1004, GROUND_Y - 48);
        coin(1028, GROUND_Y - 96);
        spike(1208);
        coinArc(1240, 400, 3);
        block(1412, GROUND_Y - 48);
        coin(1436, GROUND_Y - 96);
        spike(1592);
        spike(1640);
        coinArc(1690, 400, 3);
        block(1820, GROUND_Y - 48);
        coin(1844, GROUND_Y - 96);
        spike(2024);
        coinArc(2050, 400, 3);
        block(2228, GROUND_Y - 48);
        coin(2252, GROUND_Y - 96);
        spike(2408);
        spike(2456);
        coinArc(2500, 400, 3);
        block(2636, GROUND_Y - 48);
        coin(2660, GROUND_Y - 96);
        spike(2840);
        coinArc(2870, 400, 3);
        block(3044, GROUND_Y - 48);
        coin(3068, GROUND_Y - 96);
        spike(3224);
        spike(3272);
        coinArc(3320, 400, 3);
        block(3452, GROUND_Y - 48);
        coin(3476, GROUND_Y - 96);
        spike(3656);
        coinArc(3680, 400, 3);
        block(3860, GROUND_Y - 48);
        coin(3884, GROUND_Y - 96);
        spike(4040);
        spike(4088);
        coinArc(4140, 400, 3);
        block(4268, GROUND_Y - 48);
        coin(4292, GROUND_Y - 96);
        spike(4472);
        coinArc(4500, 400, 3);
        block(4676, GROUND_Y - 48);
        coin(4700, GROUND_Y - 96);
        spike(4856);
        spike(4904);
        coinArc(4950, 400, 3);
        block(5084, GROUND_Y - 48);
        coin(5108, GROUND_Y - 96);
        spike(5288);
        coinArc(5310, 400, 3);
        block(5492, GROUND_Y - 48);
        coin(5516, GROUND_Y - 96);
        spike(5696);
        coinArc(5720, 400, 3);
        block(5900, GROUND_Y - 48);
        coin(5924, GROUND_Y - 96);
        spike(6104);
        coinArc(6130, 400, 3);
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
    spikes.length = 0;
  }

  return {
    GROUND_H, GROUND_Y, LEVEL_MAX_W, W, H, TILE,
    platforms, coins, spikes, flag,
    stars, clouds,
    THEMES, LEVELS,
    clearScene, coinArc,
  };
})();