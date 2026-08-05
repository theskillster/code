// Geometry-Dash conversion smoke-test runner.
// Loads the six game modules as ES modules against a stub DOM and asserts on
// real behavior. Loaded by level3_smoke.html via <script type="module">.
import { Audio } from "../js/audio.js";
import { Input } from "../js/input.js";
import { Levels } from "../js/levels.js";
import { Entities } from "../js/entities.js";
import { Renderer } from "../js/renderer.js";
// Side-effect import: game.js self-initializes and sets window.__neon.
import "../js/game.js";

const out = [];
const log = (s) => out.push(s);
const results = document.getElementById("results");
function check(name, cond, detail) {
  log((cond ? "PASS  " : "FAIL  ") + name + (detail ? "  (" + detail + ")" : ""));
}

// ---- Task 1: auto-run + jump ----
check("totalLevels is 3", Entities.gameState.totalLevels === 3, Entities.gameState.totalLevels);
window.__neon.loadLevel(1);
const p1 = Entities.player;
p1.x = 80; p1.y = Levels.GROUND_Y - 46; p1.vy = 0; p1.vx = 0; p1.onGround = true;
const x0 = p1.x;
Input.keys.jump = false;
Entities.update(0.016);
check("auto-run moves the player right", p1.x > x0, x0 + " -> " + Math.round(p1.x));
check("auto-run keeps constant vx", p1.vx === Entities.AUTO_SPEED, "vx=" + p1.vx);
check("AUTO_SPEED is 340", Entities.AUTO_SPEED === 340);
check("TILE is 48", Entities.TILE === 48);
// Jump fires while on the ground and the jump input is held.
p1.onGround = true; p1.vy = 0;
Input.keys.jump = true;
Entities.update(0.016);
check("jump fires on ground while held", p1.vy < 0, "vy=" + p1.vy);
// One gravity frame has already run, so vy = -JUMP_V + GRAV*dt.
check("jump is fixed height (JUMP_V)",
  Math.abs(p1.vy + Entities.JUMP_V) <= Entities.GRAV * 0.016 + 0.01, "vy=" + p1.vy);
// Cube angle spins in air.
const a0 = p1.angle;
Entities.update(0.016);
check("cube spins in the air", p1.angle !== a0, a0 + " -> " + p1.angle.toFixed(1));
// ---------------- end of task block ----------------

// ---- Task 2: death = instant restart ----
window.__neon.loadLevel(1);
const p2 = Entities.player;
Entities.gameState.attempts = 3;
p2.x = 100; p2.y = Levels.GROUND_Y - 46; p2.vy = 0; p2.onGround = true; p2.invuln = 0;
const spike0 = Levels.spikes[0];
p2.x = spike0.x - 10; // walk into the first spike
for (let i = 0; i < 60 && Entities.gameState.dying === 0; i++) Entities.update(0.016);
check("spike contact starts the death beat", Entities.gameState.dying > 0, "dying=" + Entities.gameState.dying);
check("no life is deducted (no lives system)", !("lives" in Entities.gameState));
// After the beat the level restarts at x=80 and attempts increments.
for (let i = 0; i < 60 && Entities.gameState.dying > 0; i++) Entities.update(0.016);
check("level restarts after the beat", Entities.gameState.attempts === 4 && p2.x === 80,
  "attempts=" + Entities.gameState.attempts + " x=" + Math.round(p2.x));
// Percent progress exists.
Entities.update(0.05);
const pct = (p2.x / Entities.gameState.levelW) * 100;
check("percent progress tracked", pct > 0 && pct <= 100, "pct=" + pct.toFixed(1));
// ---------------- end of task block ----------------

// ---- Task 3: no enemies, blocks exist ----
check("no enemies array", !Levels.enemies);
check("no keys/gates/life hearts", !Levels.keyItems && !Levels.gates && !Levels.lifePickups);
window.__neon.loadLevel(3);
const hasBlock = Levels.platforms.some((p) => p.kind === "block");
check("level 3 has blocks", hasBlock, "blocks=" + Levels.platforms.filter((p) => p.kind === "block").length);
// Landing on a block top is safe.
const b0 = Levels.platforms.find((p) => p.kind === "block");
const p3 = Entities.player;
Input.keys.jump = false; // don't bounce off the block — just land
p3.x = b0.x + 5; p3.y = b0.y - 46; p3.vy = 0; p3.invuln = 0;
Entities.gameState.dying = 0;
Entities.update(0.016);
check("landing on a block top is safe", Entities.gameState.dying === 0 && p3.onGround);
// ---------------- end of task block ----------------

// ---- Task 4: new level data + block side lethal ----
check("LEVELS[1].width is 4800", Levels.LEVELS[1] && Levels.LEVELS[1].width === 4800, Levels.LEVELS[1] && Levels.LEVELS[1].width);
check("LEVELS[2].width is 5100", Levels.LEVELS[2] && Levels.LEVELS[2].width === 5100, Levels.LEVELS[2] && Levels.LEVELS[2].width);
check("LEVELS[3].width is 6200", Levels.LEVELS[3] && Levels.LEVELS[3].width === 6200, Levels.LEVELS[3] && Levels.LEVELS[3].width);
window.__neon.loadLevel(1);
check("level 1 builds without enemies", Levels.platforms.every((p) => p.kind !== "enemy"));
check("no enemy draw calls remain", typeof Renderer.drawEnemy === "undefined");
window.__neon.loadLevel(3);
const p4 = Entities.player;
const wall = Levels.platforms.find((p) => p.kind === "block");
p4.x = wall.x - 20; p4.y = Levels.GROUND_Y - 46; p4.vy = 0; p4.vx = 0; p4.onGround = true; p4.invuln = 0;
Entities.gameState.dying = 0;
for (let i = 0; i < 30 && Entities.gameState.dying === 0; i++) Entities.update(0.016);
check("hitting a block side kills", Entities.gameState.dying > 0, "dying=" + Entities.gameState.dying);
// ---------------- end of task block ----------------

// Reachability BFS: every surface in each new level must be reachable from the
// start by running jumps (uses the real physics constants).
const { GRAV, JUMP_V, AUTO_SPEED } = Entities;
const maxRise = (JUMP_V * JUMP_V) / (2 * GRAV);
const timeToHeight = (h) => (JUMP_V + Math.sqrt(JUMP_V * JUMP_V - 2 * GRAV * h)) / GRAV;
const airtime = (dy) => (dy < 0 ? timeToHeight(-dy) : JUMP_V / GRAV + Math.sqrt((2 * (maxRise + dy)) / GRAV));
for (const lvl of [1, 2, 3]) {
  window.__neon.loadLevel(lvl);
  const surfs = Levels.platforms.slice().sort((a, b) => a.x - b.x);
  const reach = new Set([0]);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < surfs.length; i++) {
      if (!reach.has(i)) continue;
      const A = surfs[i];
      for (let j = 0; j < surfs.length; j++) {
        if (reach.has(j) || surfs[j].x < A.x) continue;
        const dy = surfs[j].y - A.y;
        if (dy < 0 && -dy > maxRise + 1) continue;
        if (surfs[j].x <= A.x + A.w + AUTO_SPEED * airtime(dy) - 8) {
          reach.add(j);
          changed = true;
        }
      }
    }
  }
  const unreachable = surfs.filter((s, i) => !reach.has(i));
  check("level " + lvl + " every surface reachable (BFS)", unreachable.length === 0,
    unreachable.map((s) => s.kind + "@" + s.x).join(","));
}

// ---- Task 5: visual API ----
check("Audio.getBpm exists", typeof Audio.getBpm === "function");
check("theme has cube color", !!Entities.gameState.theme.cube);
window.__neon.loadLevel(2);
check("level 2 theme is purple", Entities.gameState.theme.cube === "#e879f9");
// Angle snaps to the nearest 90 on landing: drop the cube from just above
// the ground with a non-square angle; the landing frame must snap it.
Input.keys.jump = false; // don't bounce — force a real landing
Entities.gameState.dying = 0; // clear the death beat left by the block-side test
const p5 = Entities.player;
p5.x = 120; p5.y = Levels.GROUND_Y - 56; p5.vy = 0; p5.angle = 123;
p5.onGround = false;
for (let i = 0; i < 10 && !p5.onGround; i++) Entities.update(0.016);
check("cube angle snaps to 90 on landing", p5.angle % 90 === 0, "angle=" + p5.angle);
// ---------------- end of task block ----------------

// ---- Hold-jump beatability simulation ----
// A pure-hold run of each level must reach the finish with ZERO deaths.
// The live game loop runs on requestAnimationFrame (≈60Hz), so we simulate
// at dt = 1/60 — NOT an arbitrary 0.016s — because the jump physics are
// frame-quantized and the landing cadence shifts with dt. This is what
// catches hazards sitting on the in-game landing cadence (≈ 86 + 204k),
// which the reachability BFS cannot see.
const SIM_DT = 1 / 60;
Input.keys.jump = false;
for (const lvl of [1, 2, 3]) {
  window.__neon.playLevel(lvl);
  Input.keys.jump = true; // hold to bounce
  Entities.gameState.dying = 0;
  let frames = 0;
  const maxFrames = Math.ceil(Entities.gameState.levelW / Entities.AUTO_SPEED / SIM_DT) + 200;
  let deaths = 0;
  let lastA = Entities.gameState.attempts;
  while (frames < maxFrames && Entities.gameState.state === "playing") {
    Entities.update(SIM_DT);
    frames++;
    if (Entities.gameState.attempts !== lastA) {
      deaths++;
      lastA = Entities.gameState.attempts;
    }
  }
  const won = Entities.gameState.state === "win";
  check("level " + lvl + " hold-jump beats it with 0 deaths (dt=" + SIM_DT.toFixed(4) + ")", won && deaths === 0,
    "won=" + won + " deaths=" + deaths + " frames=" + frames);
  Input.keys.jump = false;
}
// ---------------- end of task block ----------------

// ---- Task 5 wiring (kept essentials) ----
check("totalLevels is 3", Entities.gameState.totalLevels === 3, Entities.gameState.totalLevels);
window.__neon.loadLevel(3);
Renderer.updateHUD();
check("badge shows Sunflare Ridge", document.getElementById("level-name-badge").textContent === "Sunflare Ridge",
  document.getElementById("level-name-badge").textContent);

results.textContent = out.join("\n");
