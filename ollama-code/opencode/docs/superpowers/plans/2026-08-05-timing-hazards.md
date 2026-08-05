# Timing-Demanding Hazards Implementation Plan (Gaps, Overhangs, Jump Orbs)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three timing-demanding hazard types — ground **gaps** (pits), **low overhangs** that kill on jump, and mid-air **jump orbs** — so Neon Runner levels *require* precise input timing, and re-tune the smoke harness to prove each level is NOT hold-clearable but IS beatable with correct timing.

**Architecture:** Gaps and overhangs need almost no new physics — falling into a pit already kills (`updateBoundaries`: `player.y > H + 80`), and block underside/side contact is already lethal (`updateVertical`'s `p.kind === "block"` branch). The only new game system is **jump orbs** (mid-air tap re-jump): a small `updateOrbs()` system in `entities.js` driven by the existing `jumpBuffer`/`jumpPressed` input edge. Data lives in `levels.js` (`gaps[]` + `gap()` builder, `orbs[]` + `orb()` builder); the renderer gets `drawOrbs()` and a pit-abyss glow. The harness replaces its hold-jump-only sim with a **dual-check sim**: a pure-hold run must DIE on levels with timing hazards (proving they require timing) while a deterministic **timed-policy sim** (reads `Levels.gaps`/`orbs`/platforms, releases before pits/overhangs, taps at orbs) must WIN with 0 deaths (proving beatability).

**Tech Stack:** Vanilla ES modules (no build step, no Node required at runtime — the Node headless driver in `smoke.sh` is optional), Canvas 2D, existing WebAudio sfx. Tests = the browser/Node harness at `/static/tests/level3_smoke.html` + `level3_smoke_node.mjs`.

## Global Constraints

- **No Node.js, no npm, no bundlers, no new deps** — browser-native ES modules only.
- **Physics constants are locked:** `GRAV = 2300`, `AUTO_SPEED = 340`, `JUMP_V = 700` (max rise ≈ 106.5 px, flat-jump distance ≈ 207 px continuous, measured ~204 px at dt = 1/60), `MAX_FALL = 1300`, `COYOTE = 0.09`, `BUFFER = 0.12`, `TILE = 48`. Player hitbox 34×46.
- **Hold-cadence landings at dt = 1/60: x ≈ 86 + 204k** (measured live). Any hazard placed on the landing cadence itself is a timing trap; mid-arc hazards (landing + ~102) are hold-clearable.
- **Gaps must be ≤ 180 px wide** (flat jump ~204 px leaves a margin) and their far edge must be reachable: the reachability BFS in the harness must stay green.
- **Orbs are one-shot** per level pass: `used` flag, rebuilt fresh on `loadLevel` (they live in `Levels.orbs` which `clearScene` empties). Orbs activate on a **tap edge** (`jumpBuffer > 0` from a fresh `jumpPressed`), NOT on hold.
- **Overhangs are just `block()`s placed elevated** (`y = GROUND_Y - 90`, bottom at `GROUND_Y - 66`): running under is safe (20 px headroom over the grounded player's top at `GROUND_Y - 46`), jumping hits the underside and kills via the existing block branch. No new collision code.
- **Harness stays green at every commit.** The old per-level "hold-jump beats it with 0 deaths" assertions are replaced in the same task that introduces timing hazards (never before, so the tree is never red).
- **Windows/other machines:** no absolute paths, no `flask --app` references; run via `uv run opencode` and `./.freebuff/smoke.sh`.
- Commit each task separately with project style (`feat:`, `refactor:`, `test:`, `docs:`), staging only touched files.

---

### Task 1: Level-data plumbing — `gaps[]` and `orbs[]` builders

**Files:**
- Modify: `src/opencode/static/js/levels.js` (scene arrays, builders, `clearScene`, exports)
- Test: `src/opencode/static/tests/level3_smoke_runner.js` (new data-API checks)

**Interfaces:**
- Consumes: existing `ground(x, w)`, `block(x, y, w, h)`, `coin`, `spike`, `coinArc` builders; `clearScene()`; the `return { ... }` export object.
- Produces: `Levels.gaps` (array of `{ x, w }`), `Levels.orbs` (array of `{ x, y, r: 18, used: false }`), builder `gap(x, w)` and `orb(x, y)`, both cleared by `clearScene()` and exported.

- [ ] **Step 1: Write the failing data-API tests**

Append to `src/opencode/static/tests/level3_smoke_runner.js` (before the final `results.textContent` line), after the Task 5 visual-API block:

```js
// ---- Task 6: timing-hazard data API ----
check("Levels.gaps exists and starts empty", Array.isArray(Levels.gaps) && Levels.gaps.length === 0,
  "len=" + (Levels.gaps && Levels.gaps.length));
check("Levels.orbs exists and starts empty", Array.isArray(Levels.orbs) && Levels.orbs.length === 0,
  "len=" + (Levels.orbs && Levels.orbs.length));
window.__neon.loadLevel(3);
check("level 3 gap() builder creates a gap", Levels.gaps.some((g) => g.x === 2474 && g.w === 180),
  JSON.stringify(Levels.gaps.slice(0, 3)));
check("level 3 orb() builder creates an orb", Levels.orbs.some((o) => o.x === 4110 && o.r === 18),
  JSON.stringify(Levels.orbs.slice(0, 3)));
check("gap width is within jump range", Levels.gaps.every((g) => g.w <= 180),
  Levels.gaps.map((g) => g.w).join(","));
// ---------------- end of task block ----------------
```

- [ ] **Step 2: Run to verify the tests fail**

Run the harness (see Task 5's run procedure). Expected: the four new checks FAIL — `Levels.gaps`/`Levels.orbs` are `undefined`, and level 3's build doesn't create the fixtures yet. All existing checks still PASS (34).

- [ ] **Step 3: Implement the builders in levels.js**

In `src/opencode/static/js/levels.js`:

1. Add to the scene-array declarations (next to `const spikes = [];`):

```js
  const gaps = [];
  const orbs = [];
```

2. Add next to the other builders. **Note: `gap()` is pure data** — it only
   records the pit; the pit becomes lethal only when `build()` splits the
   ground with two `ground()` calls around it. Task 1 adds the data fixtures
   WITHOUT splitting the ground, so gameplay is byte-identical and every
   existing check stays green:

```js
  // A pit in the ground — falling in kills (updateBoundaries). Data-only:
  // build() must split ground() around it for it to be lethal. Max 180px.
  const gap = (x, w) => gaps.push({ x, w });
  // Mid-air jump orb: tap while overlapping to re-jump mid-flight. One-shot.
  const orb = (x, y) => orbs.push({ x, y, r: 18, used: false });
```

3. In `clearScene()`, add `gaps.length = 0; orbs.length = 0;`.

4. In the `return { ... }`, add `gaps, orbs,` (alphabetical, next to `flag`/`coins`).

- [ ] **Step 4: Add the level-3 fixtures (data only — gameplay unchanged)**

In `LEVELS[3].build()` (Sunflare Ridge), right after the `ground(0, 6200);`
line, add — WITHOUT splitting the ground (the pit is not lethal until Task 5
splits it):

```js
        gap(2474, 180);
        orb(4110, GROUND_Y - 80);
```

These satisfy the data-API tests. Because `gap()` is data-only and `orb()`
needs a tap edge (never fired by the hold sim, which sets `keys.jump` but never
`jumpPressed`), every existing check — including the level-3 hold-jump sim —
stays green.

- [ ] **Step 5: Run the harness — all checks pass**

Reload `/static/tests/level3_smoke.html` in the preview (or run `node
src/opencode/static/tests/level3_smoke_node.mjs` where Node exists). Expected:
all previous checks PASS and the five new data checks PASS — **39 checks, 0
FAIL**, including `level 3 hold-jump beats it with 0 deaths`.

- [ ] **Step 6: Verify**

`uv run ruff check .` — clean (no Python touched). In the preview, load the
game and `window.__neon.playLevel(3)` from the console — the level plays
exactly as before (the orb/gap are invisible until Task 6's renderer work, and
inert until Task 5 splits the ground). Console clean.

- [ ] **Step 7: Commit**

```bash
git add src/opencode/static/js/levels.js src/opencode/static/tests/level3_smoke_runner.js
git commit -m "feat: gaps and orb data builders for timing hazards"
```

---

### Task 2: Jump-orb physics — `updateOrbs()` in entities.js

**Files:**
- Modify: `src/opencode/static/js/entities.js` (destructure `orbs` from Levels, new `updateOrbs`, call it in `update()`, export `BUFFER` if not already)
- Test: `src/opencode/static/tests/level3_smoke_runner.js` (orb activation checks)

**Interfaces:**
- Consumes: Task 1 (`Levels.orbs` with `{ x, y, r, used }`), existing `keys.jumpPressed` edge consumed by `updateTimers` into `player.jumpBuffer` (BUFFER 0.12), `circleRect`, `sfx.jump`, `dust`.
- Produces: `updateOrbs()` — when airborne, `jumpBuffer > 0`, and overlapping an unused orb: sets `player.vy = -JUMP_V`, `player.jumpBuffer = 0`, `orb.used = true`, plays `sfx.jump()` + dust. Called in `update()` right after `updateJump(dt)`.

- [ ] **Step 1: Write the failing orb tests**

Append to the runner (same location as before):

```js
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
```

- [ ] **Step 2: Run to verify they fail**

Expected: `orb tap re-jumps mid-air` FAILs (`vy` unchanged — no `updateOrbs` yet), the others fail on the same missing function. All other checks PASS.

- [ ] **Step 3: Implement `updateOrbs` in entities.js**

1. In the `Levels` destructure add `orbs`:

```js
  const {
    GROUND_H, GROUND_Y, W, H,
    platforms, coins, spikes, orbs,
    LEVELS, THEMES, LEVEL_MAX_W,
  } = Levels;
```

2. Add the system next to `updateSpikes`:

```js
  // Jump orbs (GD-style): tap while airborne and overlapping an unused orb to
  // get an immediate mid-air re-jump. One-shot; consumed on use. Fires on the
  // tap edge (jumpBuffer > 0) only — holding alone never triggers it, and a
  // ground tap was already consumed by updateJump (buffer zeroed there).
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
```

3. In `update()`, after `updateJump(dt);` add `updateOrbs();`.

4. Export `BUFFER` if not already in the return object (the harness uses `Entities.BUFFER` in Task 3's policy sim — add it to the `return` list: `GRAV, AUTO_SPEED, JUMP_V, MAX_FALL, COYOTE, BUFFER, TILE,`).

- [ ] **Step 4: Run the harness — all pass**

Expected: the four orb checks PASS, everything else unchanged. Total checks: 43.

- [ ] **Step 5: Verify + commit**

`uv run ruff check .` (clean). In the preview, `window.__neon.playLevel(3)`, teleport the player next to `Levels.orbs[0]` via `window.__neon.player.x = Levels.orbs[0].x - 6; window.__neon.player.y = Levels.orbs[0].y - 10; window.__neon.player.vy = 0;` and press Space in the preview — the player visibly re-jumps mid-air (the orb is invisible until Task 5, but the physics jump is visible).

```bash
git add src/opencode/static/js/entities.js src/opencode/static/tests/level3_smoke_runner.js
git commit -m "feat: mid-air jump orbs (tap to re-jump)"
```

---

### Task 3: Overhang safety + gap-death regression locks

**Files:**
- Modify: none required for physics (overhang death + gap death already work via existing `updateVertical`/`updateBoundaries`)
- Test: `src/opencode/static/tests/level3_smoke_runner.js` (regression locks)

**Interfaces:**
- Consumes: existing block-side/underside lethality; `updateBoundaries` pit death; `Levels.gaps`.
- Produces: four regression checks that lock in the hazard semantics so later level redesigns can't silently break them.

- [ ] **Step 1: Write the regression-lock tests**

Append:

```js
// ---- Task 8: gap + overhang semantics (regression locks) ----
window.__neon.loadLevel(3);
const p8 = Entities.player;
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
// kills. Load the level, push the temp block, and exercise it all inside one
// function so a later loadLevel cannot wipe the block mid-test.
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
```

- [ ] **Step 2: Run — the semantics checks must pass immediately**

Expected: `running into a gap kills` PASSes (temporary pit built from level-1
ground + existing `updateBoundaries`), and `overhang: running under is safe,
jumping into it kills` PASSes (existing `updateVertical` block branch + the
temporary elevated block). These are locks, not new behavior — they should be
green on the first run. Total checks: 45.

- [ ] **Step 3: Commit**

```bash
git add src/opencode/static/tests/level3_smoke_runner.js
git commit -m "test: regression locks for gap-fall and overhang lethality"
```

---

### Task 4: Level-2 redesign — first real timing hazard (gap)

**Files:**
- Modify: `src/opencode/static/js/levels.js` (`LEVELS[2].build()`)
- Test: `src/opencode/static/tests/level3_smoke_runner.js` (dual-check sim structure)

**Interfaces:**
- Consumes: Tasks 1–3 (`gap()` builder, gap-fall death, orb system), physics constants, the measured hold-cadence (landings ≈ 86 + 204k at dt = 1/60).
- Produces: Level 2 has one real timing gap; the harness gains the **dual-check sim**: `simulateHold(lvl)` returns `{ won, deaths }`, `simulateTimed(lvl)` returns `{ won, deaths }`; per-level expectations: L1 hold-clearable (control), L2 NOT hold-clearable but timed-clearable.

- [ ] **Step 1: Write the dual-check sim in the harness**

Replace the entire current `// ---- Hold-jump beatability simulation ----` block (the `const SIM_DT = 1 / 60; ... Input.keys.jump = false;` loop for `[1, 2, 3]`) with:

```js
// ---- Timing-aware beatability simulation ----
// A level must (a) NOT be clearable by pure hold (it requires timing) and
// (b) BE clearable by a deterministic timed policy (it is fair/beatable).
const SIM_DT = 1 / 60;
const FLAT = 204; // measured flat-jump landing distance at dt=1/60 (verify in Task 4 Step 3)

function simulateHold(lvl) {
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
    if (Entities.gameState.attempts !== lastA) { deaths++; lastA = Entities.gameState.attempts; }
  }
  Input.keys.jump = false;
  return { won: Entities.gameState.state === "win", deaths };
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
  let lastA = Entities.gameState.attempts;
  let tappedOrbs = new Set();
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
    if (Entities.gameState.attempts !== lastA) { deaths++; lastA = Entities.gameState.attempts; }
  }
  Input.keys.jump = false;
  return { won: Entities.gameState.state === "win", deaths };
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
  "won=" + h2.won + " deaths=" + h2.deaths);
const t2 = simulateTimed(2);
check("level 2 timed-policy beats it with 0 deaths", t2.won && t2.deaths === 0,
  "won=" + t2.won + " deaths=" + t2.deaths);

// Level 3 (redesigned in Task 5) gets its checks there; for now assert data only.
check("level 3 has at least one gap", Levels.LEVELS[3] && Levels.gaps.length > 0,
  "gaps=" + Levels.gaps.length);
```

- [ ] **Step 2: Run — new checks FAIL (as designed)**

Expected: `level 2 hold-jump CANNOT clear it` FAILs (level 2 is currently
hold-clearable — the red proof that timing is not yet required). `level 2
timed-policy beats it` currently PASSes trivially (no gap yet, policy = hold),
which is fine — it becomes meaningful after the redesign. L1 control checks
PASS. This is the intentional red state before the redesign.

- [ ] **Step 3: Redesign Level 2 — insert the timing gap**

In `src/opencode/static/js/levels.js`, `LEVELS[2].build()` (The Voltage Vault, width 5100):

1. Replace the `ground(0, 5100);` line with a split around a new gap at
   hold-landing x ≈ 2942 (mid-level, after the existing `block(2636,
   GROUND_Y - 48); coin(2660, GROUND_Y - 96);`):

```js
        ground(0, 2862);
        gap(2862, 180);
        ground(3042, 5100 - 3042);
```

2. Delete the hazards that now overlap the gap region and re-center the following hazards on the post-gap cadence. Remove `spike(2840); coinArc(2870, 400, 3); block(3044, GROUND_Y - 48); coin(3068, GROUND_Y - 96);`. Keep `spike(3248)` onwards but **re-measure and re-center** per Step 4 — the gap shifts the landing phase by the distance from the old landing (2738) to the new landing after the gap jump (3042 + ~8), so every subsequent hazard must move to the new mid-arc. Start by moving the next hazard `spike(3248, GROUND_Y - 48)` → `spike(3356, GROUND_Y - 48)` (new landing ≈ 3254 → mid-arc ≈ 3356) and cascade forward by running the sim.

- [ ] **Step 4: Empirical tuning loop — run the sim, nudge until green**

Reload the harness. Iterate:
1. If `level 2 timed-policy beats it` FAILs, find the death x (the harness's `deaths` detail shows attempts; temporarily add `console.log(Math.round(Entities.player.x))` inside `simulateTimed` right after a death, or run the level live with `window.__neon` and read `player.x` at death).
2. If the death is at the gap: the takeoff jump-point is wrong — shift `gap`'s x by ±12 px (one physics step) so the timed policy's jump (landing at `p.x + 204 > gap.x + gap.w + 8`) clears it, keeping `gap.w <= 180` and both `ground()` calls matching the gap edges exactly.
3. If the death is at a hazard AFTER the gap: that hazard sits on the new cadence — move it toward mid-arc of the new landing (landing ≈ 3254 + 204k after the Task-4 gap). Nudge by 12–24 px and re-run.
4. Repeat until `timed-policy` wins with 0 deaths AND `hold-jump CANNOT clear it` still dies (verify the gap is not accidentally hold-clearable: hold lands inside the gap at 2942 → dies).
5. Confirm the reachability BFS for level 2 still PASSes (`gap.w <= 180` guarantees it if the far ground starts within 204 px).

- [ ] **Step 5: Final verification**

- Harness: all checks PASS (47 total — the L2 dual checks replace the old
  per-level hold checks; see the count notes in each task).
- `uv run ruff check .` — clean.
- Preview live playtest: `window.__neon.playLevel(2)`; the player must die by
  falling into the gap on pure hold (hold Space) and must clear it by releasing
  before the gap and re-pressing to jump over. Console clean.

- [ ] **Step 6: Commit**

```bash
git add src/opencode/static/js/levels.js src/opencode/static/tests/level3_smoke_runner.js
git commit -m "feat: level 2 timing gap — hold no longer clears it"
```

---

### Task 5: Level-3 redesign — gaps, overhangs, and orbs

**Files:**
- Modify: `src/opencode/static/js/levels.js` (`LEVELS[3].build()`)
- Test: `src/opencode/static/tests/level3_smoke_runner.js` (level-3 dual checks)

**Interfaces:**
- Consumes: Task 4 (`simulateHold`/`simulateTimed`, `overhangAhead`, FLAT = 204), Task 3 overhang semantics, Tasks 1–2 builders/orbs.
- Produces: Level 3 is NOT hold-clearable and IS timed-clearable, mixing all three hazard types; harness gains L3 dual checks (total 47).

- [ ] **Step 1: Add level-3 dual checks to the harness**

Append after the Task-4 block:

```js
// ---- Task 9: level 3 timing checks ----
const h3 = simulateHold(3);
check("level 3 hold-jump CANNOT clear it (requires timing)", !h3.won && h3.deaths > 0,
  "won=" + h3.won + " deaths=" + h3.deaths);
const t3 = simulateTimed(3);
check("level 3 timed-policy beats it with 0 deaths", t3.won && t3.deaths === 0,
  "won=" + t3.won + " deaths=" + t3.deaths);
// ---------------- end of task block ----------------
```

- [ ] **Step 2: Run — FAIL (as designed)**

`level 3 hold-jump CANNOT clear it` FAILs (level 3 is currently hold-clearable). L3 timed-policy also FAILs until the redesign.

- [ ] **Step 3: Redesign Level 3 (Sunflare Ridge, width 6200)**

Rewrite `LEVELS[3].build()` body — replacing the Task-1 fixture lines
(`gap(2474, 180); orb(4110, GROUND_Y - 80);`) with the full layout below —
keeping the existing spike/block rhythm but adding, in order:

1. **Gap 1** at hold-landing ≈ 2534 (mid-level). The ground is built as ONE
   contiguous run of segments — never overlapping `ground()` calls, each gap
   carved between two segments:

```js
        ground(0, 2474);
        gap(2474, 180);
        ground(2654, 4004 - 2654);
        gap(4004, 180);
        ground(4184, 6200 - 4184);
        orb(4110, GROUND_Y - 80);
```

2. Delete the hazards that overlap Gap 1: `spike(2432); spike(2480);` and
   `block(2636, GROUND_Y - 48); coin(2660, GROUND_Y - 96);`. Delete the
   hazards overlapping Gap 2: `spike(4040); spike(4088);`. Re-center every
   hazard between the gaps and after Gap 2 on the new cadence (cascade per
   Task 4 Step 4).
3. **Overhang** at hold-landing ≈ 3146 (inside the 2654–4004 segment):
   `block(3106, GROUND_Y - 90, 120, 24)` (bottom at `GROUND_Y - 66`, 20 px
   headroom). The timed policy releases under it; hold jumps into it and dies.
   Re-center the hazards after the overhang on the post-overhang cadence.
4. **Jump orb** ≈ 4110 floats over Gap 2 at apex height — a rhythm bonus the
   timed policy taps mid-air over the pit (it is NOT required to cross the
   180 px gap; it extends the arc, so re-center the hazards after Gap 2 on the
   orb-extended landing phase).
5. Keep the final stretch hazards (5288 → 6104) but re-center them on the
   final cadence per the tuning loop.

Exact coordinates must be tuned empirically (Step 4) — the sim is the oracle.
Keep every `gap` ≤ 180 px, keep ground segments contiguous (adjacent segments
share an edge, never overlap), and never place an orb under a ceiling.

- [ ] **Step 4: Empirical tuning loop**

Same procedure as Task 4 Step 4, now for three hazards in sequence. Run the harness after every layout edit. Order of attack: make Gap 1 green first, then the overhang, then Gap 2, then the orb section, then the tail. The `overhangAhead` policy must keep working — if the overhang's underside is too low (`under >= groundedTop`) it's treated as a normal hop-over block (fine — make the overhang bottom at `GROUND_Y - 66` exactly so `under = GROUND_Y - 66 < groundedTop = GROUND_Y - 46`, still above apex check).

- [ ] **Step 5: Verify + playtest**

- Harness: all 49 checks PASS, including L2/L3 dual checks and the 3 BFS checks.
- `uv run ruff check .` — clean.
- Preview: `window.__neon.playLevel(3)`. Hold → dies at the first gap. Play with releases + taps → clears. The orb visibly re-jumps on tap. The overhang kills a bounce but lets the player run under. Console clean.

- [ ] **Step 6: Commit**

```bash
git add src/opencode/static/js/levels.js src/opencode/static/tests/level3_smoke_runner.js
git commit -m "feat: level 3 mixes gaps, overhangs, and jump orbs"
```

---

### Task 6: Renderer — `drawOrbs`, pit abyss, overhang tint, HUD hint

**Files:**
- Modify: `src/opencode/static/js/renderer.js` (drawOrbs, drawGaps, overhang styling, call in `draw()`)
- Modify: `src/opencode/templates/index.html` (hint copy)
- Modify: `src/opencode/static/css/main.css` (orb/gap styling hooks if needed)
- Test: `src/opencode/static/tests/level3_smoke_runner.js` (drawOrbs/drawGaps existence checks)

**Interfaces:**
- Consumes: `Levels.orbs`, `Levels.gaps`, `Levels.GROUND_Y`, `gameState.theme`, existing `ctx` helpers, `Audio.getBpm()` (orb pulse can beat-sync like the background).
- Produces: `Renderer.drawOrbs()` and `Renderer.drawGaps()` exported; called from `draw()`; orb renders as a pulsing neon ring with glow, gaps render as a dark abyss with a hazard rim.

- [ ] **Step 1: Write the failing renderer tests**

Append:

```js
// ---- Task 10: renderer API ----
check("Renderer.drawOrbs exists", typeof Renderer.drawOrbs === "function");
check("Renderer.drawGaps exists", typeof Renderer.drawGaps === "function");
// ---------------- end of task block ----------------
```

- [ ] **Step 2: Run — FAIL**

Both FAIL (`undefined`). All other checks PASS.

- [ ] **Step 3: Implement the draws in renderer.js**

1. In the `Levels` destructure add `gaps, orbs,` (renderer currently pulls `platforms, coins, spikes, THEMES`).

2. Add before `drawCoins`:

```js
  // --- Gaps: dark abyss with a glowing hazard rim (warning edge) ---
  function drawGaps() {
    for (const g of gaps) {
      const gx = g.x;
      const gy = Levels.GROUND_Y;
      const gw = g.w;
      ctx.fillStyle = "rgba(2,6,23,0.95)";
      ctx.fillRect(gx, gy, gw, H - gy);
      ctx.fillStyle = "rgba(248,113,113,0.10)";
      ctx.fillRect(gx, gy, gw, 24);
      ctx.strokeStyle = gameState.theme.spike;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx, gy + 18);
      ctx.moveTo(gx + gw, gy);
      ctx.lineTo(gx + gw, gy + 18);
      ctx.stroke();
    }
  }
```

3. Add after `drawBlocks`:

```js
  // --- Jump orbs: pulsing neon ring, beat-synced, one-shot (fades when used) ---
  function drawOrbs() {
    const bpm = Audio.getBpm();
    for (const o of orbs) {
      const pulse = 1 + 0.25 * Math.sin((gameState.animTime * bpm) / 60 * Math.PI * 2);
      ctx.save();
      ctx.globalAlpha = o.used ? 0.15 : 1;
      ctx.shadowColor = gameState.theme.glow;
      ctx.shadowBlur = 14 * pulse;
      ctx.strokeStyle = gameState.theme.glow;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(o.x, o.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
```

4. In `draw()`, after `drawPlatforms(); drawBlocks();` add `drawGaps();` and after `drawCoins();` add `drawOrbs();`.

5. Export both in the `return { ... }`.

- [ ] **Step 4: Style overhangs distinctly (optional but recommended)**

In `drawBlocks`, when `b.y < Levels.GROUND_Y - 46` (elevated = overhang), draw a warning stripe along the underside:

```js
      if (b.y < Levels.GROUND_Y - 46) {
        ctx.fillStyle = "rgba(248,113,113,0.25)";
        ctx.fillRect(b.x + 2, b.y + b.h - 6, b.w - 4, 4);
      }
```

- [ ] **Step 5: Update the hint copy in index.html**

Replace the `game-hint` paragraph with:

```html
    <p class="game-hint">
      Auto-run · <kbd>Space</kbd> / <kbd>↑</kbd> / <kbd>W</kbd> to jump —
      hold to keep bouncing · release to run under overhangs and time gaps ·
      tap <kbd>Space</kbd> on a glowing orb to re-jump mid-air ·
      <kbd>P</kbd> pause · <kbd>R</kbd> restart
    </p>
```

- [ ] **Step 6: Verify**

- Harness: all 51 checks PASS.
- Preview: level 3 shows the pulsing orb ring, the dark pit abyss with red rim
  on gaps, and warning stripes under overhangs. `preview_logs` clean.
- `uv run ruff check .` — clean.

- [ ] **Step 7: Commit**

```bash
git add src/opencode/static/js/renderer.js src/opencode/templates/index.html src/opencode/static/tests/level3_smoke_runner.js
git commit -m "feat: render gaps, orbs, and overhang warnings"
```

---

### Task 7: Docs refresh + end-to-end verification + review

**Files:**
- Modify: `README.md` (game description, controls, hazard list)
- Modify: `MODULES.md` (module table line counts, harness description, check count)
- Modify: `.freebuff/run.md` (smoke-test description if it lists check counts)
- Test: full harness + smoke.sh + ruff

**Interfaces:** consumes all of Tasks 1–6.

- [ ] **Step 1: Update README.md game description**

Add to the "The game" section (after Level 3's bullet): a **"Timing hazards"** paragraph:

```markdown
**Timing is the real enemy.** Levels now mix **ground gaps** (release to run
and time your jump over the pit), **low overhangs** (jump into one and you
shatter — run underneath instead), and **jump orbs** (tap mid-air on a glowing
ring to re-jump). Holding jump no longer clears a level — you have to feel the
rhythm.
```

Update the Controls table to mention the orb tap and releases, and the "You die in one hit" line to include pits.

- [ ] **Step 2: Update MODULES.md**

Re-measure line counts (`wc -l src/opencode/static/js/*.js`), update the module table, and update the harness paragraph: "…timing-hazard data API, gap-fall and overhang lethality locks, and a dual hold/timed-policy beatability sim proving levels require timing but stay beatable (49 checks)."

- [ ] **Step 3: Verify — full gate**

- `./.freebuff/smoke.sh` → all HTTP checks OK, ruff clean, and (where Node
exists) the Node harness prints 51 PASS.
- Browser harness in the preview: 51 PASS, console clean.
- Playtest all three levels live: L1 hold-clearable warm-up, L2 gap timing, L3
  full mix.

- [ ] **Step 4: Review the whole change set**

Dispatch `code-reviewer-deepseek-flash` over the 7 commits (levels.js builders/redesigns, entities.js updateOrbs, renderer draws, harness dual sim). Fix any findings, re-run the harness + ruff, then commit fixes.

- [ ] **Step 5: Commit**

```bash
git add README.md MODULES.md .freebuff/run.md
git commit -m "docs: timing hazards, orb taps, and dual-check harness"
```

---

## Self-Review (completed at plan time)

**Spec coverage** — gaps (Tasks 1, 4, 5 + renderer Task 6), low overhangs (Task 3 locks + Task 5 placement + Task 6 warning stripes), jump orbs (Task 2 physics + Task 5 placement + Task 6 draw), harness re-tuned to prove "requires timing, still beatable" (Tasks 4–5 dual sim replacing the old hold-only check). All spec bullets map to tasks.

**Placeholder scan** — no TBDs; every step has concrete code or an exact verification procedure. The empirical tuning loops (Tasks 4–5) are intentional and concrete — the physics is frame-quantized (proven in this repo), so exact hazard coordinates can only be validated by running the sim; the plan gives starting coordinates, the failure→nudge mapping (±12 px), and the sim as the gate.

**Type consistency** — `gap(x, w)` pushes `{ x, w }` (data-only; lethal only when build() splits ground — Task 1 fixtures don't split, Tasks 4–5 do); `orb(x, y)` pushes `{ x, y, r: 18, used: false }`; `Levels.gaps`/`Levels.orbs` used identically in harness (`Levels.gaps`, `Levels.orbs`), entities (`orbs`), renderer (`gaps, orbs`). `simulateHold`/`simulateTimed` return `{ won, deaths }` everywhere. `FLAT = 204` defined once (Task 4) and reused (Task 5). `overhangAhead(p)` defined in Task 4, used in Task 5 unchanged. `Renderer.drawOrbs`/`drawGaps` names match the Task 6 tests. Check-count totals verified: 39 → 43 → 45 → 47 → 49 → 51 across tasks.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-05-timing-hazards.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — I execute the tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
