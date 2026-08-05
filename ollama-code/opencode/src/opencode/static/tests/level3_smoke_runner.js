// Level 3 + stack smoke-test runner.
// Loads the six game modules as ES modules against a stub DOM and asserts on
// real behavior. Loaded by level3_smoke.html via <script type="module">.
import { Audio } from "../js/audio.js";
import { Input } from "../js/input.js";
import { Levels } from "../js/levels.js";
import { Entities } from "../js/entities.js";
import { Renderer } from "../js/renderer.js";
import { Game } from "../js/game.js";

"use strict";
const out = [];
const log = (s) => out.push(s);
const results = document.getElementById("results");
function check(name, cond, detail) {
  log((cond ? "PASS  " : "FAIL  ") + name + (detail ? "  (" + detail + ")" : ""));
}
// ---- Task 1: level data ----
check("LEVELS[3] exists", !!Levels.LEVELS[3], Levels.LEVELS[3] && Levels.LEVELS[3].name);
check("LEVELS[3].width is 6200", Levels.LEVELS[3] && Levels.LEVELS[3].width === 6200, Levels.LEVELS[3] && Levels.LEVELS[3].width);
check("LEVEL_MAX_W is 6400", Levels.LEVEL_MAX_W === 6400, Levels.LEVEL_MAX_W);
check("THEMES[3] exists", !!Levels.THEMES[3]);
window.__neon.loadLevel(3);
check("loadLevel(3) builds without throwing", Entities.gameState.currentLevel === 3);
check("level 3 has > 30 coins", Levels.coins.length > 30, Levels.coins.length);
check("level 3 has >= 6 checkpoints", Entities.gameState.CHECKPOINTS.length >= 6, Entities.gameState.CHECKPOINTS.length);
// Reachability: every surface must be reachable from the start by running
// jumps (uses the real physics constants). A surface B is reachable from A
// when B's left edge is within jump range of A's right edge, where airtime
// accounts for the height delta (landing lower = more airtime, jumping up
// capped at the max jump height).
const { GRAV, JUMP_V, MOVE } = Entities;
const maxRise = (JUMP_V * JUMP_V) / (2 * GRAV);
// Time until the jumper is at height h again while FALLING (the game only
// lets the player land while moving downward).
const timeToHeight = (h) => (JUMP_V + Math.sqrt(JUMP_V * JUMP_V - 2 * GRAV * h)) / GRAV;
const airtime = (dy) => (dy < 0 ? timeToHeight(-dy) : JUMP_V / GRAV + Math.sqrt((2 * (maxRise + dy)) / GRAV));
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
      if (surfs[j].x <= A.x + A.w + MOVE * airtime(dy) - 8) {
        reach.add(j);
        changed = true;
      }
    }
  }
}
const unreachable = surfs.filter((s, i) => !reach.has(i));
check("every surface is reachable (jump BFS)", unreachable.length === 0,
  unreachable.map((s) => s.kind + "@" + s.x).join(","));
// ---------------- end of task block ----------------
// ---- Task 2: darter ----
window.__neon.loadLevel(3);
const darter0 = Levels.enemies.find((e) => e.kind === "darter");
check("level 3 has darter enemies", !!darter0);
const p = Entities.player;
p.x = darter0.x - 60; p.y = Levels.GROUND_Y - 46; p.vy = 0; p.vx = 0;
p.invuln = 10;
Input.keys.left = Input.keys.right = Input.keys.jump = false;
const startX = darter0.x;
let sawDash = false;
for (let i = 0; i < 40 && !sawDash; i++) {
  Entities.update(0.04);
  if (darter0.state === "dash") sawDash = true;
}
Entities.update(0.04); // one more frame so the dash actually moves the enemy
check("darter charges up then dashes", sawDash, "state=" + darter0.state);
check("darter moved during dash", darter0.x !== startX, startX + " -> " + darter0.x);
// Stomp kills a waiting darter.
window.__neon.loadLevel(3);
const d2 = Levels.enemies.find((e) => e.kind === "darter");
p.x = d2.x + 5; p.y = d2.y - 40; p.vy = 300; p.invuln = 0;
Entities.update(0.016);
check("stomping a waiting darter kills it", !d2.alive);
// Dashing darter hurts (dying timer starts, life not yet deducted).
window.__neon.loadLevel(3);
const d3 = Levels.enemies.find((e) => e.kind === "darter");
d3.state = "dash"; d3.timer = 300; d3.dir = 1;
p.x = d3.x + d3.w + 10; p.y = Levels.GROUND_Y - 46; p.vy = 0; p.invuln = 0;
Entities.update(0.04);
check("dashing darter hits the player", Entities.gameState.dying > 0, "dying=" + Entities.gameState.dying);
// ---------------- end of task block ----------------
// ---- Task 3: life heart ----
window.__neon.loadLevel(3);
const life = Levels.lifePickups.find((l) => !l.taken);
check("level 3 has life pickups", !!life);
Entities.gameState.dying = 0; // clear the death-beat left by the darter dash test
const livesBefore = Entities.gameState.lives;
p.x = life.x - 10; p.y = life.y - 23; p.invuln = 10;
Entities.update(0.016);
check("collecting a life heart adds a life", Entities.gameState.lives === livesBefore + 1, livesBefore + " -> " + Entities.gameState.lives);
check("life heart is consumed", life.taken);
// Cap + HUD: hearts render past 3.
Entities.gameState.lives = 6;
Renderer.updateHUD();
check("HUD renders 6 hearts", document.getElementById("hud-lives").textContent === "\u2665".repeat(6));
check("sfx.life exists", typeof Audio.sfx.life === "function");
// ---------------- end of task block ----------------
// ---- Task 4: track 3 ----
Audio.playMusic(3);
check("playMusic(3) starts without throwing", Audio.musicActive());
// ---------------- end of task block ----------------
// ---- Task 5: wiring ----
check("totalLevels is 3", Entities.gameState.totalLevels === 3, Entities.gameState.totalLevels);
Audio.stopMusic(); // prove playLevel itself starts the music
window.__neon.playLevel(3);
check("playLevel(3) enters level 3", Entities.gameState.currentLevel === 3 && Entities.gameState.state === "playing");
check("level 3 starts its music", Audio.musicActive());
Renderer.updateHUD();
check("badge shows Sunflare Ridge", document.getElementById("level-name-badge").textContent === "Sunflare Ridge");
// Win level 2 -> level 3 intro shows the darter copy.
window.__neon.playLevel(2);
p.x = 4860; p.y = Levels.GROUND_Y - 46; p.vy = 0; p.vx = 0; p.invuln = 10;
Entities.update(0.016); // triggers onWin -> complete screen -> 2s countdown -> nextLevel
setTimeout(() => {
  const title = document.getElementById("overlay-title").textContent;
  const text = document.getElementById("overlay-text").textContent;
  check("level 3 intro shows after level 2 win", /Level 3/.test(title), title);
  check("level 3 intro mentions darters", /darters/.test(text), text.slice(0, 60));
  results.textContent = out.join("\n");
}, 3200);
// (The final print below runs immediately; the setTimeout re-prints ~3.2s
// later with the two async checks.)
// ---------------- end of task block ----------------
results.textContent = out.join("\n");
