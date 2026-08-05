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

// ---- Timing-aware beatability simulation ----
// A level must (a) NOT be clearable by pure hold (it requires timing) and
// (b) BE clearable by a deterministic timed policy (it is fair/beatable).
// The live game loop runs on requestAnimationFrame (≈60Hz), so we simulate
// at dt = 1/60 — NOT an arbitrary 0.016s — because the jump physics are
// frame-quantized and the landing cadence shifts with dt. This is what
// catches hazards sitting on the in-game landing cadence (≈ 86 + 204k),
// which the reachability BFS cannot see.
const SIM_DT = 1 / 60;
const FLAT = 204; // measured flat-jump landing distance at dt=1/60
Input.keys.jump = false;

function simulateHold(lvl) {
  window.__neon.playLevel(lvl);
  Input.keys.jump = true; // hold to bounce
  Entities.gameState.dying = 0;
  let frames = 0;
  const maxFrames = Math.ceil(Entities.gameState.levelW / Entities.AUTO_SPEED / SIM_DT) + 200;
  let deaths = 0;
  const deathXs = [];
  let prevDying = Entities.gameState.dying;
  while (frames < maxFrames && Entities.gameState.state === "playing") {
    Entities.update(SIM_DT);
    frames++;
    // onHurt fires BEFORE the beat/respawn, so a dying 0→>0 transition captures
    // the player still at the death spot (attempts increments later, post-respawn).
    if (prevDying <= 0.01 && Entities.gameState.dying > 0.2) {
      deaths++;
      deathXs.push(Math.round(Entities.player.x));
    }
    prevDying = Entities.gameState.dying;
  }
  Input.keys.jump = false;
  return { won: Entities.gameState.state === "win", deaths, deathXs };
}

// Deterministic timed policy: reads the real level data.
// - Grounded: hold (jump) unless the next landing lands in a gap OR the jump
//   would launch the cube into an overhang (elevated block) — then release
//   and run past it.
// - Airborne: tap when an unused orb is within tap range.
function overhangAhead(p) {
  const groundedTop = Levels.GROUND_Y - 46;
  const apexTop = groundedTop - (Entities.JUMP_V * Entities.JUMP_V) / (2 * Entities.GRAV);
  for (const b of Levels.platforms) {
    if (b.kind !== "block") continue;
    const under = b.y + b.h;          // underside y (smaller = higher)
    if (under <= apexTop) continue;   // jump fully clears it — not an overhang
    if (under >= groundedTop) continue; // sits on the ground (normal block) — hop over
    // horizontal sweep of a jump launched from p.x: [p.x, p.x + 34 + FLAT]
    if (p.x < b.x + b.w && p.x + 34 + FLAT > b.x) return true;
  }
  return false;
}

function simulateTimed(lvl) {
  window.__neon.playLevel(lvl);
  Input.keys.jump = false;
  Entities.gameState.dying = 0;
  let frames = 0;
  const maxFrames = Math.ceil(Entities.gameState.levelW / Entities.AUTO_SPEED / SIM_DT) + 400;
  let deaths = 0;
  const deathXs = [];
  let prevDying = Entities.gameState.dying;
  const tappedOrbs = new Set();
  while (frames < maxFrames && Entities.gameState.state === "playing") {
    const p = Entities.player;
    if (p.onGround) {
      const landX = p.x + FLAT;
      // Release while the next landing is inside the pit OR within 12px of its
      // far edge; re-jump only when the landing lands 12px+ past the far edge.
      const inGap = Levels.gaps.some((g) => landX > g.x && landX < g.x + g.w + 12);
      Input.keys.jump = !(inGap || overhangAhead(p));
    } else {
      const orb = Levels.orbs.find((o) => !o.used && !tappedOrbs.has(o) &&
        Math.abs(o.x - (p.x + p.w / 2)) < o.r + 14 &&
        Math.abs(o.y - (p.y + p.h / 2)) < o.r + 14);
      if (orb) {
        Input.keys.jump = false;
        Input.setKey("Space", true); // fresh tap edge → jumpBuffer → updateOrbs
        tappedOrbs.add(orb);
      }
    }
    Entities.update(SIM_DT);
    frames++;
    if (prevDying <= 0.01 && Entities.gameState.dying > 0.2) {
      deaths++;
      deathXs.push(Math.round(Entities.player.x));
    }
    prevDying = Entities.gameState.dying;
  }
  Input.keys.jump = false;
  return { won: Entities.gameState.state === "win", deaths, deathXs };
}

// Level 1 stays the hold-clearable control (no timing hazards yet).
const h1 = simulateHold(1);
check("level 1 hold-jump still beats it with 0 deaths (control)", h1.won && h1.deaths === 0,
  "won=" + h1.won + " deaths=" + h1.deaths);
const t1 = simulateTimed(1);
check("level 1 timed-policy beats it with 0 deaths", t1.won && t1.deaths === 0,
  "won=" + t1.won + " deaths=" + t1.deaths);

// Level 2 now REQUIRES timing: hold dies, timed policy wins.
const h2 = simulateHold(2);
check("level 2 hold-jump CANNOT clear it (requires timing)", !h2.won && h2.deaths > 0,
  "won=" + h2.won + " deaths=" + h2.deaths + " deathXs=" + h2.deathXs.join(","));
const t2 = simulateTimed(2);
check("level 2 timed-policy beats it with 0 deaths", t2.won && t2.deaths === 0,
  "won=" + t2.won + " deaths=" + t2.deaths + " deathXs=" + t2.deathXs.join(","));

// Level 3 (redesigned in Task 5) gets its checks there; for now assert data only.
window.__neon.loadLevel(3); // reload so we inspect level 3's data, not the sim's last level
check("level 3 has at least one gap", Levels.LEVELS[3] && Levels.gaps.length > 0,
  "gaps=" + Levels.gaps.length);
// ---------------- end of task block ----------------

// ---- Task 6: timing-hazard data API ----
check("Levels.gaps and orbs exist", Array.isArray(Levels.gaps) && Array.isArray(Levels.orbs),
  "gaps=" + (Levels.gaps && Levels.gaps.length) + " orbs=" + (Levels.orbs && Levels.orbs.length));
check("clearScene empties gaps and orbs", (() => {
  Levels.clearScene();
  return Levels.gaps.length === 0 && Levels.orbs.length === 0;
})(), "gaps=" + Levels.gaps.length + " orbs=" + Levels.orbs.length);
window.__neon.loadLevel(3);
check("level 3 gap() builder creates a gap", Levels.gaps.some((g) => g.x === 2474 && g.w === 180),
  JSON.stringify(Levels.gaps.slice(0, 3)));
check("level 3 orb() builder creates an orb", Levels.orbs.some((o) => o.x === 4110 && o.r === 18),
  JSON.stringify(Levels.orbs.slice(0, 3)));
check("gap width is within jump range", Levels.gaps.every((g) => g.w <= 180),
  Levels.gaps.map((g) => g.w).join(","));
// ---------------- end of task block ----------------

// ---- Task 7: jump-orb physics ----
window.__neon.loadLevel(3);
const pO = Entities.player;
const orb0 = Levels.orbs[0];
pO.x = orb0.x - 6; pO.y = orb0.y - 10; pO.vy = 0; pO.onGround = false; pO.invuln = 0;
Entities.gameState.dying = 0;
Input.keys.jump = false;
Input.setKey("Space", true); // fresh tap edge → jumpBuffer
Entities.update(0.016);
check("orb tap re-jumps mid-air", pO.vy === -Entities.JUMP_V, "vy=" + pO.vy);
check("orb is consumed on use", orb0.used === true);
// Holding jump alone must never trigger an orb (no tap edge fired).
window.__neon.loadLevel(3);
const pOH = Entities.player;
const orbH = Levels.orbs[0];
pOH.x = orbH.x - 6; pOH.y = orbH.y - 10; pOH.vy = 0; pOH.onGround = false; pOH.invuln = 0;
Entities.gameState.dying = 0;
Input.keys.jump = true; // hold only — jumpPressed stays false
Entities.update(0.016);
check("holding alone never fires an orb", !orbH.used, "used=" + orbH.used);
Input.keys.jump = false;
// Ground taps must not double-jump via an orb: a fresh tap while grounded is
// consumed by updateJump (buffer zeroed), so even an orb overlapping the
// grounded player must NOT fire. Push a temporary orb right on top of the
// grounded player to prove it.
window.__neon.loadLevel(3);
const pG = Entities.player;
pG.x = 120; pG.y = Levels.GROUND_Y - 46; pG.vy = 0; pG.onGround = true; pG.invuln = 0;
const orbG = { x: pG.x + 17, y: Levels.GROUND_Y - 10, r: 18, used: false };
Levels.orbs.push(orbG);
Entities.gameState.dying = 0;
Input.keys.jump = false;
Input.setKey("Space", true);
Entities.update(0.016);
check("ground tap under an orb does not fire the orb", !orbG.used, "used=" + orbG.used);
// ---------------- end of task block ----------------

// ---- Task 8: gap + overhang semantics (regression locks) ----
// A gap with no ground under it: run into it → fall → death. Build a temporary
// REAL pit from level 1's ground (test-only) so this lock is self-contained
// and does not depend on Task 4/5's level redesigns.
const gapFall = (() => {
  window.__neon.loadLevel(1);
  // Rebuild a tiny dedicated scene so the pit is real. Mutate the existing
  // arrays in place — reassigning Levels.platforms would NOT affect the
  // reference entities.js destructured at module load.
  Levels.clearScene();
  Levels.gaps.push({ x: 500, w: 120 });
  Levels.platforms.push({ x: 0, y: Levels.GROUND_Y, w: 500, h: 60, kind: "ground" });
  Levels.platforms.push({ x: 620, y: Levels.GROUND_Y, w: 200, h: 60, kind: "ground" });
  const p = Entities.player;
  p.x = 510; p.y = Levels.GROUND_Y - 46; p.vy = 0; p.onGround = true; p.invuln = 999;
  Input.keys.jump = false;
  Entities.gameState.dying = 0;
  let died = false;
  for (let i = 0; i < 300 && !died; i++) {
    Entities.update(0.016);
    if (Entities.gameState.dying > 0) died = true;
  }
  return died;
})();
check("running into a gap kills (fall death)", gapFall === true);
// An elevated block is an overhang: running under is safe, jumping into it
// kills. Exercise it all inside one function so a later loadLevel cannot wipe
// the temporary block mid-test.
const over = () => {
  window.__neon.loadLevel(1);
  Levels.clearScene();
  Levels.platforms.push({ x: 0, y: Levels.GROUND_Y, w: 600, h: 60, kind: "ground" });
  Levels.platforms.push({ x: 200, y: Levels.GROUND_Y - 90, w: 120, h: 24, kind: "block" });
  const p = Entities.player;
  p.x = 202; p.y = Levels.GROUND_Y - 46; p.vy = 0; p.onGround = true; p.invuln = 0;
  Input.keys.jump = false;
  Entities.gameState.dying = 0;
  Entities.update(0.016); // stand under it for one frame
  const runSafe = Entities.gameState.dying === 0;
  Input.keys.jump = true;
  for (let i = 0; i < 30 && Entities.gameState.dying === 0; i++) Entities.update(0.016);
  const jumpKills = Entities.gameState.dying > 0;
  Input.keys.jump = false;
  return "runSafe=" + runSafe + " jumpKills=" + jumpKills;
};
const overRes = over();
check("overhang: running under is safe, jumping into it kills", overRes === "runSafe=true jumpKills=true", overRes);
// ---------------- end of task block ----------------

// ---- Task 5 wiring (kept essentials) ----
check("totalLevels is 3", Entities.gameState.totalLevels === 3, Entities.gameState.totalLevels);
window.__neon.loadLevel(3);
Renderer.updateHUD();
check("badge shows Sunflare Ridge", document.getElementById("level-name-badge").textContent === "Sunflare Ridge",
  document.getElementById("level-name-badge").textContent);
// The sims above WIN levels, which arms a ~2s auto-advance overlay timer in
// game.js's loop. Reset to level 1 so a pending nextLevel() lands on a valid
// level (LEVELS[2]) instead of crashing on LEVELS[4] after the checks finish.
window.__neon.playLevel(1);

results.textContent = out.join("\n");
