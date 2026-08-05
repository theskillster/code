# Geometry Dash Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Neon Runner from a free-moving platformer with enemies and lives into a Geometry Dash-style rhythm runner: constant auto-run speed, jump-only control, hazard-based levels (spikes + blocks, no enemies), instant-restart death loop with attempts and a percent progress bar, and a neon geometric visual style with cube spin and beat-synced pulsing.

**Architecture:** The game stays in the six existing ES modules. `entities.js` becomes the physics core (auto-run + fixed jump, block side-collision = death, instant restart), `levels.js` drops all enemy/key/gate/life-heart data and gains a `block()` builder, `renderer.js` swaps the robot sprite for a spinning neon cube with a non-rotating hitbox plus a grid floor and beat pulses, `game.js` removes the lives/game-over/safe-respawn systems and drives attempts + percent + progress HUD, and `input.js` is jump-only. The smoke harness (`level3_smoke_runner.js`) is extended per task so the tree stays green at every commit.

**Tech Stack:** Vanilla ES modules (no build step, no Node — browser-native), Canvas 2D with `shadowBlur` glow, WebAudio procedural BGM (existing). Python/Flask backend unchanged. Tests = the browser harness at `/static/tests/level3_smoke.html`.

## Global Constraints

- **No Node.js, no npm, no bundlers, no new deps** — same as the current stack.
- **Zero enemies.** No walker/flyer/shooter/darter builders, update systems, or draw functions may remain. Levels use only `ground`, `block`, `spike`, `coin`.
- **Auto-run only.** The player never controls horizontal movement. `keys.left`/`keys.right` are removed from `input.js` and the touch bar.
- **Jump is fixed-height.** No variable jump (remove the `vy < -260` cut in `input.js`). Holding the jump input auto-re-jumps on landing (GD jump buffering).
- **Death = instant restart.** On any hazard contact or fall, play a short (~0.5s) shatter beat, increment `gameState.attempts`, and restart the *same level from x=0*. No lives, no life hearts, no safe-respawn, no game-over screen.
- **Win = reach 100%.** The flag is removed; the level ends when `player.x + player.w >= levelW`. Level-complete and next-level intro keep the existing auto-advance countdowns.
- **Physics constants (locked):** `GRAV = 2300`, `AUTO_SPEED = 340` (renamed from `MOVE`), `JUMP_V = 700` (max rise ≈ 106px, flat-airtime ≈ 0.61s, flat distance ≈ 207px), `MAX_FALL = 1300`, `COYOTE = 0.09`, `BUFFER = 0.12`, `TILE = 48` (new).
- **Blocks are lethal on non-top contact:** landing on top is safe; hitting a block's side or underside kills. Ground segments stay safe everywhere.
- **HUD becomes:** `Coins x/N` · `Attempts N` · `Best %` · a full-width **progress bar** · sound/pause buttons. Score, lives, key, and timer are removed.
- **`window.__neon` dev hook keeps working** (drives the harness); its shape may change.
- Commit each task separately with project style (`feat:`, `refactor:`), staging only touched files.

---

### Task 1: Auto-run movement and jump-only input

**Files:**
- Modify: `src/opencode/static/js/entities.js` (physics constants, `player`, `updateMovement`, `updateJump`, `updateRunAnim`, exports)
- Modify: `src/opencode/static/js/input.js` (KEYMAP, `onKeyUp`, `bindInput`)
- Modify: `src/opencode/templates/index.html` (touch controls, hint text)
- Modify: `src/opencode/static/css/main.css` (touch bar for single button)
- Modify: `src/opencode/static/tests/level3_smoke_runner.js` (replace the darter/heart/wiring blocks with auto-run + jump checks; the BFS references `Entities.MOVE` → `AUTO_SPEED`)

**Interfaces:**
- Consumes: nothing new (first task).
- Produces: `Entities.AUTO_SPEED` (= 340, replaces `MOVE`; keep `MOVE` deleted — update every reference), `player.angle` (deg, starts 0), jump fires while `keys.jump` is held on the ground, `Input.keys` = `{ jump, jumpPressed }` only. `Input.bindInput(getPlayer, togglePause, restartRun)` signature unchanged.

- [ ] **Step 1: Update physics constants and player state in entities.js**

Replace the physics block:

```js
  // --- Physics constants ---
  const GRAV = 2300;
  const AUTO_SPEED = 340; // constant forward speed (Geometry Dash style)
  const JUMP_V = 700;
  const MAX_FALL = 1300;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const TILE = 48;
```

In the `player` object, replace `facing: 1` and `run: 0` with:

```js
    facing: 1,
    angle: 0, // cube spin, degrees; snapped to 90° on landing
    trailT: 0, // trail particle spawn timer
```

- [ ] **Step 2: Rewrite updateMovement as auto-run**

Replace the whole `updateMovement` function with:

```js
  // Auto-run: the player always moves right at constant speed. No horizontal
  // control — Geometry Dash style. X-clamp only (no X push-out; block sides
  // are lethal and handled in updateVertical).
  function updateMovement(dt) {
    const gs = gameState;
    player.vx = AUTO_SPEED;
    player.facing = 1;
    player.x += player.vx * dt;
    player.x = Math.min(player.x, gs.levelW - player.w);
  }
```

- [ ] **Step 3: Rewrite updateJump as fixed-height + hold-to-rejump**

Replace `updateJump` with:

```js
  // Jump: fixed-height (GD). Fires on ground contact while the jump input is
  // held — holding the button auto-re-jumps on every landing. Coyote + buffer
  // keep it forgiving.
  function updateJump(dt) {
    if (player.onGround && (keys.jump || player.jumpBuffer > 0)) {
      player.vy = -JUMP_V;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.onGround = false;
      sfx.jump();
      dust(player.x + player.w / 2, player.y + player.h, 5);
    }
  }
```

Note: `keys.jumpPressed` is no longer needed for jumping (hold covers it) — `updateTimers` keeps resetting it; harmless.

- [ ] **Step 4: Cube spin in updateRunAnim**

Replace `updateRunAnim` with:

```js
  // Cube spin: spins in the air (~2 rev/s), snaps to the nearest 90° on landing.
  function updateRunAnim(dt) {
    if (player.onGround) {
      player.angle = Math.round(player.angle / 90) * 90;
    } else {
      player.angle = (player.angle + dt * 720) % 360;
    }
  }
```

- [ ] **Step 5: Update the export list**

In the final `return`, rename `MOVE` → `AUTO_SPEED` and add `TILE`:

```js
  return {
    GRAV, AUTO_SPEED, JUMP_V, MAX_FALL, COYOTE, BUFFER, TILE,
    player, gameState,
    overlap, circleRect, fmtTime,
    particles, sparkle, burst, dust, confetti,
    updateParticles, update, updateCamera, resetPlayer,
    setCallbacks,
  };
```

- [ ] **Step 6: input.js — jump-only KEYMAP**

Replace the KEYMAP with:

```js
  const KEYMAP = {
    Space: "jump",
    ArrowUp: "jump",
    KeyW: "jump",
  };
```

Delete the variable-jump cut in `onKeyUp` — the whole `onKeyUp` becomes:

```js
  function onKeyUp(e) {
    setKey(e.code, false);
  }
```

And in `bindInput`, keep the touch wiring but change the `down`/`up` handlers to hold-state only (no `vy < -260` cut):

```js
      const down = (e) => {
        e.preventDefault();
        if (k === "jump" && !keys.jump) keys.jumpPressed = true;
        keys[k] = true;
      };
      const up = (e) => {
        e.preventDefault();
        keys[k] = false;
      };
```

`keys` becomes `{ jump: false, jumpPressed: false }` (drop `left`/`right`).

- [ ] **Step 7: index.html — single jump button and new hint**

In `src/opencode/templates/index.html`, replace the touch-controls block with a single jump button:

```html
      <div class="touch-controls" aria-hidden="true">
        <button class="touch-btn touch-jump touch-wide" data-key="jump" type="button">⬆ TAP</button>
      </div>
```

Replace the hint paragraph with:

```html
    <p class="game-hint">
      Auto-run · <kbd>Space</kbd> / <kbd>↑</kbd> / <kbd>W</kbd> / click to jump —
      hold to keep jumping · <kbd>P</kbd> pause · <kbd>R</kbd> restart
    </p>
```

- [ ] **Step 8: CSS — wide touch button**

In `src/opencode/static/css/main.css`, add after the `.touch-jump` rules:

```css
.touch-wide {
  max-width: 340px;
  width: 100%;
  font-size: 1.6rem;
}
```

- [ ] **Step 9: Update the smoke harness**

In `src/opencode/static/tests/level3_smoke_runner.js`:
1. Change `const { GRAV, JUMP_V, MOVE } = Entities;` to `const { GRAV, JUMP_V, AUTO_SPEED } = Entities;` and the BFS `MOVE * airtime(dy)` → `AUTO_SPEED * airtime(dy)`.
2. Delete the Task 2 (darter) block, the Task 3 (life heart) block, and the Task 4 (music) block — those features are being removed.
3. Delete the Task 5 wiring block except the `totalLevels is 3` and badge checks, which stay.
4. Add this new Task 1 block (place after the reachability check):

```js
// ---- Task 1: auto-run + jump ----
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
check("jump is fixed height (JUMP_V)", p1.vy === -Entities.JUMP_V, "vy=" + p1.vy);
// Cube angle spins in air.
const a0 = p1.angle;
Entities.update(0.016);
check("cube spins in the air", p1.angle !== a0, a0 + " -> " + p1.angle.toFixed(1));
// ---------------- end of task block ----------------
```

- [ ] **Step 10: Verify**

Start the server if needed (`uv run opencode --port 5000` in a screen session, per `.freebuff/run.md`). Then in the Preview tab:
- Navigate to `/` — the game boots; the Start screen shows.
- Click Start. The player must **auto-run right** with no key presses. Press/hold Space: fixed-height jumps; holding re-jumps on landing.
- `preview_logs` must be empty of errors.
- Navigate to `/static/tests/level3_smoke.html` — every line prints PASS (the old darter/heart checks are gone).
- `uv run ruff check .` stays clean (no Python touched).

- [ ] **Step 11: Commit**

```bash
git add src/opencode/static/js/entities.js src/opencode/static/js/input.js src/opencode/templates/index.html src/opencode/static/css/main.css src/opencode/static/tests/level3_smoke_runner.js
git commit -m "feat: auto-run and jump-only controls (geometry-dash movement)"
```

---

### Task 2: Death = instant restart with attempts and percent

**Files:**
- Modify: `src/opencode/static/js/entities.js` (gameState: remove lives, add attempts; `updateLives` → delete; `updateSpikes` unchanged; `updateBoundaries` → remove flag, win on full level)
- Modify: `src/opencode/static/js/game.js` (remove `onGameOver`, safe-respawn trio, `findSafeRespawn`; rewrite `onHurt`/`resolveHurt`; `start()`; `onWin`; `setCallbacks` call)
- Modify: `src/opencode/templates/index.html` (HUD: remove lives/key/time/score, add attempts + progress bar)
- Modify: `src/opencode/static/css/main.css` (progress bar styles, attempts pill)
- Modify: `src/opencode/static/tests/level3_smoke_runner.js` (add death→restart + attempts + percent checks; remove the `totalLevels`/badge wiring that referenced lives)

**Interfaces:**
- Consumes: Task 1 (`AUTO_SPEED`, `TILE`, fixed jump).
- Produces: `gameState.attempts` (int), `gameState.levelW` (exists), `gameState.progressPct()` helper NOT added — percent computed in `renderer` as `player.x / levelW`. `setCallbacks(onHurt, onWin, onHurtResolve)` — the `onGameOver` callback is **removed** from the signature (update both `entities.js` `setCallbacks` and the `game.js` call).

- [ ] **Step 1: gameState — remove lives, add attempts**

In `entities.js` `gameState`, replace `lives: 3` with `attempts: 0` and delete the `keyCount` field (keys are gone in Task 3; leaving it is harmless but this task removes its HUD). Delete the `dying` comment block is NOT required yet — the death beat stays.

- [ ] **Step 2: Delete `updateLives` and remove it from `update()`**

Delete the entire `updateLives` function (life hearts are being removed) and remove the `updateLives();` line from `update()`.

- [ ] **Step 3: updateBoundaries — win on full level, no flag**

Replace `updateBoundaries` with:

```js
  // Boundaries: fell into a pit, or reached the end of the level (100%).
  function updateBoundaries() {
    if (player.y > H + 80 && _onHurt) _onHurt(true);
    if (player.x + player.w >= gameState.levelW && _onWin) _onWin();
  }
```

- [ ] **Step 4: game.js — remove lives/game-over/safe-respawn**

In `src/opencode/static/js/game.js`:
1. Delete `findSafeRespawn`, `spotIsClear`, `surfaceAt`, and the `RESPAWN_*` constants (the whole "Safe respawn" section).
2. Replace `onHurt` and `resolveHurt` with:

```js
  // Hit detected: play the sound, pop a shatter burst, and start the death
  // beat. After the beat the level restarts from x=0 — no lives involved.
  function onHurt(fell = false) {
    if (!fell && gameState.dying > 0) return;
    sfx.hurt();
    burst(player.x + player.w / 2, player.y + player.h / 2, 18);
    player.vx = 0;
    player.vy = 0;
    gameState.dying = 0.5; // ~500ms shatter before restart
  }

  // Called once the dying timer reaches zero: restart the level, count the attempt.
  function resolveHurt() {
    gameState.dying = 0;
    gameState.attempts++;
    playLevel(gameState.currentLevel);
  }
```

3. In `start()`, replace `gameState.lives = 3;` with `gameState.attempts = 0;`.
4. Delete `onGameOver` entirely.
5. Rewrite `onWin`:

```js
  function onWin() {
    gameState.state = "win";
    stopMusic();
    sfx.win();
    confetti();
    const level = LEVELS[gameState.currentLevel];
    if (gameState.currentLevel < gameState.totalLevels) {
      const completeText =
        `Coins <strong>${gameState.coinCount}/${gameState.totalCoins}</strong> · Attempts <strong>${gameState.attempts}</strong>`;
      startOverlayCountdown(LEVEL_COMPLETE_SECONDS, completeText, "Continuing", nextLevel);
      showOverlay(
        `Level ${gameState.currentLevel} complete! 🏁`,
        completeText + `<br>Continuing in <strong>${Math.ceil(overlayTimer)}</strong>…`,
        "Next level ▶",
        nextLevel
      );
    } else {
      showOverlay(
        "You beat the game! 🏆",
        `All ${gameState.totalLevels} levels · Coins ${gameState.coinCount} · Best <strong>${best}%</strong>`,
        "Play again",
        start
      );
    }
  }
```

6. Change the `setCallbacks(onHurt, onWin, onGameOver, resolveHurt);` call to `setCallbacks(onHurt, onWin, resolveHurt);`.
7. Update `entities.js` `setCallbacks` to take 3 args (`onHurt, onWin, onHurtResolve`).
8. `best` now stores **best percent** (0–100). In `loop()`, add the best-percent update inside the playing branch:

```js
    if (gameState.state === "playing") {
      update(dt);
      updateCamera();
      const pct = Math.floor((player.x / gameState.levelW) * 100);
      if (pct > best) {
        best = pct;
        gameState.best = best;
        lsSet("opencode-best", String(best));
      }
    }
```

9. `__neon` hook keeps `playLevel`, `loadLevel`, `start`, `player` (drop `enemies`/`projectiles`; they are removed in Task 3 — leaving them harmless until then).

- [ ] **Step 5: index.html HUD — attempts + progress bar**

In `src/opencode/templates/index.html`, replace the whole `.game-hud` inner block with:

```html
      <div class="game-hud">
        <div class="hud-item"><span class="hud-label">Coins</span><span class="hud-value" id="hud-coins">0/30</span></div>
        <div class="hud-item"><span class="hud-label">Attempts</span><span class="hud-value" id="hud-attempts">0</span></div>
        <div class="hud-item"><span class="hud-label">Best</span><span class="hud-value" id="hud-best">—</span></div>
        <div class="hud-progress"><div class="hud-progress-track"><div class="hud-progress-fill" id="hud-progress"></div></div></div>
        <div class="hud-spacer"></div>
        <button class="hud-btn" id="btn-sound" type="button" title="Toggle sound">🔊</button>
        <button class="hud-btn" id="btn-pause" type="button" title="Pause">⏸️</button>
      </div>
```

- [ ] **Step 6: renderer.js els + updateHUD**

In `src/opencode/static/js/renderer.js`, in `els`, replace `hudScore`, `hudLives`, `hudKey`, `hudTime`, `hudLevel` with:

```js
    hudCoins: $("hud-coins"),
    hudAttempts: $("hud-attempts"),
    hudBest: $("hud-best"),
    hudProgress: $("hud-progress"),
```

Rewrite `updateHUD`:

```js
  function updateHUD() {
    els.hudCoins.textContent = `${gameState.coinCount}/${gameState.totalCoins}`;
    els.hudAttempts.textContent = gameState.attempts;
    els.hudBest.textContent = gameState.best ? gameState.best + "%" : "—";
    const pct = Math.max(0, Math.min(100, (player.x / gameState.levelW) * 100));
    els.hudProgress.style.width = pct.toFixed(1) + "%";
    els.levelBadge.textContent = Levels.LEVELS[gameState.currentLevel].name;
  }
```

- [ ] **Step 7: CSS — progress bar**

In `main.css`, add:

```css
.hud-progress {
  flex: 1 1 180px;
  display: flex;
  align-items: center;
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid var(--panel-border);
  border-radius: 999px;
  padding: 0.3rem 0.5rem;
}

.hud-progress-track {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #0b1020;
  overflow: hidden;
}

.hud-progress-fill {
  height: 100%;
  width: 0%;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8, #a78bfa);
  transition: width 0.1s linear;
}
```

- [ ] **Step 8: Harness — death/restart/attempts checks**

In `level3_smoke_runner.js`, add this block after the Task 1 block:

```js
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
```

- [ ] **Step 9: Verify**

Preview: Start → die on a spike (walk into it) → the cube shatters (~0.5s), then the level restarts at x=0 with **Attempts** incremented. Progress bar fills as the player auto-runs. Falling in a pit restarts too. Reaching the level end triggers the win overlay → auto-advance to level 2. Harness all PASS; console clean.

- [ ] **Step 10: Commit**

```bash
git add src/opencode/static/js/entities.js src/opencode/static/js/game.js src/opencode/templates/index.html src/opencode/static/css/main.css src/opencode/static/tests/level3_smoke_runner.js
git commit -m "feat: instant-restart death loop with attempts and progress bar"
```

---

### Task 3: Remove enemies, keys, gates, and life hearts; add blocks

**Files:**
- Modify: `src/opencode/static/js/levels.js` (delete `enemy`/`flyer`/`shooter`/`darter`/`key`/`gate`/`lifePickup` builders; delete `enemies`/`projectiles`/`keyItems`/`gates`/`lifePickups` arrays + exports; add `block` builder; clear them from `clearScene`)
- Modify: `src/opencode/static/js/entities.js` (delete `updateEnemies`, `updateKeys`, `updateGates`, `updateProjectiles`; remove their calls from `update()`; update destructure of `Levels`)
- Modify: `src/opencode/static/js/renderer.js` (delete `drawEnemy` + all 4 enemy sprites, `drawGates`, `drawKeys`, `drawLifePickups`, `drawProjectile`; remove their calls in `draw()`; add `drawBlocks`; update destructure)
- Modify: `src/opencode/static/js/game.js` (destructure no longer pulls `enemies`/`projectiles`; `__neon` drops them)
- Modify: `src/opencode/static/tests/level3_smoke_runner.js` (add no-enemies + block checks; adjust `loadLevel` assertions that counted coins/checkpoints)

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: `Levels.blocks` removed — blocks live in `Levels.platforms` with `kind: "block"`. New builder `block(x, y, w = 48, h = 48)` pushes `{ x, y, w, h, kind: "block" }`. `Levels.enemies`, `Levels.projectiles`, `Levels.keyItems`, `Levels.gates`, `Levels.lifePickups` are **gone** (any remaining reference will throw — delete them all in one task).

- [ ] **Step 1: levels.js — prune builders and arrays**

Delete these builders entirely: `enemy`, `flyer`, `shooter`, `darter`, `key`, `gate`, `lifePickup`. Delete the scene arrays `enemies`, `projectiles`, `keyItems`, `gates`, `lifePickups` (and their `clearScene` lines). Add the block builder next to `plat`:

```js
  const block = (x, y, w = 48, h = 48) => platforms.push({ x, y, w, h, kind: "block" });
```

Update the final `return` to drop the deleted arrays:

```js
  return {
    GROUND_H, GROUND_Y, LEVEL_MAX_W, W, H, TILE,
    platforms, coins, spikes, flag,
    stars, clouds,
    THEMES, LEVELS,
    clearScene, coinArc,
  };
```

(Also export `TILE` from levels.js for consistency with the new tile size — the renderer grid uses it.)

- [ ] **Step 2: entities.js — delete enemy/key/gate/projectile systems**

Delete `updateEnemies`, `updateKeys`, `updateGates`, `updateProjectiles` entirely. In `update()`, remove those four calls. Update the `Levels` destructure to drop the removed arrays:

```js
  const {
    GROUND_H, GROUND_Y, W, H,
    platforms, coins, spikes, flag,
    LEVELS, THEMES, LEVEL_MAX_W,
  } = Levels;
```

- [ ] **Step 3: renderer.js — delete enemy/gate/key/heart/projectile draws, add drawBlocks**

Delete `drawWalker`, `drawFlyer`, `drawShooter`, `drawDarter`, `drawEnemy`, `drawGates`, `drawKeys`, `drawLifePickups`, `drawProjectile`. Update the `Levels`/`Entities` destructures (drop removed names; `Entities` keeps `player, gameState, particles, fmtTime`). In `draw()`, remove the deleted calls and replace `drawPlatforms()` with `drawPlatforms(); drawBlocks();` and delete the enemy/projectile loops. Add:

```js
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
```

- [ ] **Step 4: game.js — prune destructure and __neon**

Remove `enemies`/`projectiles` from anything referencing `Levels` (the safe-respawn trio is already gone). Update `window.__neon` to:

```js
  window.__neon = { playLevel, loadLevel: loadLevel, start, player, coins: Levels.coins, spikes: Levels.spikes };
```

- [ ] **Step 5: THEMES — add block colors**

In `levels.js` `THEME_BASE`, add:

```js
    blockBody: "#1e293b",
    blockEdge: "#22d3ee",
```

(Per-level overrides in Task 5 restyle; base values keep the game readable now.)

- [ ] **Step 6: Harness — no-enemies + block checks**

Replace the old Task-3-era wiring assertions with this block:

```js
// ---- Task 3: no enemies, blocks exist ----
check("no enemies array", !Levels.enemies);
check("no keys/gates/life hearts", !Levels.keyItems && !Levels.gates && !Levels.lifePickups);
window.__neon.loadLevel(3);
const hasBlock = Levels.platforms.some((p) => p.kind === "block");
check("level 3 has blocks", hasBlock, "blocks=" + Levels.platforms.filter((p) => p.kind === "block").length);
// Landing on a block top is safe.
const b0 = Levels.platforms.find((p) => p.kind === "block");
const p3 = Entities.player;
p3.x = b0.x + 5; p3.y = b0.y - 46; p3.vy = 0; p3.invuln = 0;
Entities.gameState.dying = 0;
Entities.update(0.016);
check("landing on a block top is safe", Entities.gameState.dying === 0 && p3.onGround);
// ---------------- end of task block ----------------
```

Note: `block` side-lethality lands in Task 4 with the collision change, so don't assert it here.

- [ ] **Step 7: Verify**

Preview: game boots; Start → auto-run through levels with **no enemies anywhere**; blocks render as square tiles; keys/gates/hearts never appear. Harness PASS; console clean.

- [ ] **Step 8: Commit**

```bash
git add src/opencode/static/js/levels.js src/opencode/static/js/entities.js src/opencode/static/js/renderer.js src/opencode/static/js/game.js src/opencode/static/tests/level3_smoke_runner.js
git commit -m "refactor: remove enemies, keys, gates, life hearts; add block tiles"
```

---

### Task 4: Block side-collision is lethal + new GD-style level data

**Files:**
- Modify: `src/opencode/static/js/entities.js` (collision: block side/underside = death)
- Modify: `src/opencode/static/js/levels.js` (rewrite all three `LEVELS` `build()` bodies with ground/block/spike/coin layouts)
- Modify: `src/opencode/static/js/game.js` (`LEVEL_INTROS` copy; Start-screen copy; remove `flag` usage from `loadLevel`)
- Modify: `src/opencode/static/tests/level3_smoke_runner.js` (level-data asserts + block-side-death check + reachability BFS now validates the new layouts)

**Interfaces:**
- Consumes: Task 3 (`block()` builder, no enemies).
- Produces: new `LEVELS` (three layouts using only `ground`/`block`/`spike`/`coin`/`coinArc`), block sides lethal, `Levels.flag` unused (kept for API stability but no level sets `flagX`).

- [ ] **Step 1: Lethal block sides in updateVertical**

In `entities.js` `updateVertical`, the collision loop currently pushes the player out on side/below hits. Replace that inner logic so non-top contact with a `block` kills:

```js
    for (let s = 0; s < steps; s++) {
      player.y += stepDist;
      for (const p of platforms) {
        if (overlap(player, p)) {
          const prevBottom = player.y + player.h - stepDist;
          if (stepDist > 0 && prevBottom <= p.y + 8) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.onGround = true;
          } else if (p.kind === "block") {
            // GD rule: hitting a block from the side or underside is death.
            if (_onHurt) _onHurt();
            return;
          } else {
            player.y = p.y + p.h;
            player.vy = 0;
          }
        }
      }
      if (player.vy === 0) break;
    }
```

Also in `updateMovement`, a block whose side the auto-runner clips (before vertical resolves) must kill — add after the position update:

```js
    for (const p of platforms) {
      if (p.kind !== "block") continue;
      if (overlap(player, p)) { if (_onHurt) _onHurt(); return; }
    }
```

(Returning early from `updateMovement` is fine — `update()` proceeds, and `onHurt` zeroes velocity and starts the death beat.)

- [ ] **Step 2: Rewrite Level 1 — "Neon Meadows"**

Replace `LEVELS[1].build()` with:

```js
      build() {
        ground(0, 900);
        spike(575);
        coinArc(635, 400, 3);
        block(810, GROUND_Y - 48);
        coin(834, GROUND_Y - 96);
        ground(1000, 700);
        spike(1150);
        spike(1200);
        coinArc(1220, 400, 3);
        ground(1880, 440);
        block(2100, GROUND_Y - 48);
        block(2148, GROUND_Y - 96);
        coin(2124, GROUND_Y - 144);
        ground(2400, 800);
        spike(2550);
        spike(2600);
        spike(2650);
        coinArc(2620, 400, 3);
        block(2900, GROUND_Y - 48);
        coin(2924, GROUND_Y - 96);
        ground(3300, 300);
        block(3400, GROUND_Y - 48);
        ground(3600, 400);
        spike(3700);
        ground(4100, 700);
        coinArc(4300, 380, 3);
        coinArc(4420, 340, 4);
        coinArc(4580, 380, 3);
      },
```

Check gaps by eye: 0–720, 1000–1700 (ground(1000,700)), 1900–2320, 2400–3200, 3300–3600, 3600–4000, 4100–4800. All gaps ≤ 200px < 207px flat range — the reachability BFS will confirm. Blocks at 2100–2196 and 2148 + 48 wide sit on ground(1900,420) which ends at 2320 — reachable.

**Prototype-validated coordinates (do not revert):** with the locked physics, hold-cadence landings occur at x ≈ 80, 287, 494, 701, 908… (each +207px). The original draft had `spike(500)` — on the natural landing arc from 287 (landing at 494 overlaps the spike) — and `block(760)`, whose face a re-jump from 701 reaches with only ~35px of rise (< the 48px block top), both unavoidable deaths. The live prototype (`.freebuff/geometry-dash-prototype.html`) verified the fixes: `spike(575)` is cleared at ~100px altitude by the 494→701 arc, and `block(810)` is cleared (~95px rise) with the re-jump from 701 landing at 908. Also note frame-quantized dt adds ~10–14px landing drift in the browser — keep blocks/spikes ≥ 50px from landing points. Watch for the same trap in the Level 2/3 blocks (650, 1700–1844 staircase, 1100–1244 staircase, 2250, 3000, 4050, 2500–2596, 3350, 3700, 4650–4698): verify each sits on or clear of the local hold cadence during Task 4 verification.

- [ ] **Step 3: Rewrite Level 2 — "The Voltage Vault"**

```js
      build() {
        ground(0, 800);
        spike(420);
        spike(470);
        block(650, GROUND_Y - 48);
        coin(674, GROUND_Y - 96);
        ground(900, 500);
        spike(1000);
        spike(1050);
        spike(1100);
        coinArc(1080, 400, 3);
        ground(1500, 400);
        block(1700, GROUND_Y - 48);
        block(1748, GROUND_Y - 96);
        block(1796, GROUND_Y - 144);
        coin(1772, GROUND_Y - 192);
        ground(2000, 700);
        spike(2150);
        block(2250, GROUND_Y - 48);
        coin(2274, GROUND_Y - 96);
        spike(2350);
        ground(2800, 400);
        block(3000, GROUND_Y - 48);
        coin(3024, GROUND_Y - 96);
        ground(3300, 500);
        spike(3450);
        spike(3500);
        spike(3550);
        coinArc(3520, 400, 3);
        ground(3900, 400);
        block(4050, GROUND_Y - 48);
        ground(4400, 700);
        coinArc(4550, 380, 3);
        coinArc(4670, 340, 4);
        coinArc(4820, 380, 3);
      },
```

- [ ] **Step 4: Rewrite Level 3 — "Sunflare Ridge"**

```js
      build() {
        ground(0, 720);
        spike(380);
        spike(430);
        spike(480);
        coinArc(450, 400, 3);
        ground(900, 500);
        block(1100, GROUND_Y - 48);
        block(1148, GROUND_Y - 96);
        block(1196, GROUND_Y - 144);
        coin(1172, GROUND_Y - 192);
        ground(1500, 620);
        spike(1600);
        spike(1650);
        spike(1700);
        spike(1750);
        coinArc(1720, 400, 3);
        ground(2300, 400);
        block(2500, GROUND_Y - 48);
        block(2548, GROUND_Y - 96);
        block(2596, GROUND_Y - 48);
        coin(2572, GROUND_Y - 144);
        ground(2890, 700);
        spike(3050);
        spike(3100);
        spike(3150);
        coinArc(3120, 400, 3);
        block(3350, GROUND_Y - 48);
        ground(3600, 300);
        block(3700, GROUND_Y - 48);
        ground(3900, 500);
        spike(4000);
        spike(4050);
        spike(4100);
        coinArc(4070, 400, 3);
        ground(4500, 400);
        block(4650, GROUND_Y - 48);
        block(4698, GROUND_Y - 96);
        coin(4674, GROUND_Y - 144);
        ground(5000, 600);
        spike(5150);
        spike(5200);
        spike(5250);
        coinArc(5220, 400, 3);
        ground(5700, 500);
        coinArc(5850, 380, 3);
        coinArc(5970, 340, 4);
        coinArc(6120, 380, 3);
      },
```

- [ ] **Step 5: game.js — intro copy and Start copy**

Replace `LEVEL_INTROS` with:

```js
  const LEVEL_INTROS = {
    2: "Faster tempo, tighter jumps — <strong>spike rows</strong> and stacked block walls.<br>No enemies here: the level itself is the obstacle. Score and attempts carry over.",
    3: "The final gauntlet — <strong>four-wide spike rows</strong> and staircase block towers.<br>Memorize the rhythm. Beat it to win the game.",
  };
```

Replace the Start overlay text with:

```js
    "Auto-run neon runner: tap to jump, hold to keep bouncing.<br>Touch a spike or a block's side and you restart — how far can you get?<br>Three levels · no enemies · pure rhythm.",
```

- [ ] **Step 6: Harness — new level data + block-side death**

Replace the Task-1-era level-data checks (`LEVELS[3].width is 6200`, `level 3 has > 30 coins`, `>= 6 checkpoints`) with:

```js
// ---- Task 4: new level data ----
check("LEVELS[1].width is 4800", Levels.LEVELS[1] && Levels.LEVELS[1].width === 4800, Levels.LEVELS[1] && Levels.LEVELS[1].width);
check("LEVELS[2].width is 5100", Levels.LEVELS[2] && Levels.LEVELS[2].width === 5100, Levels.LEVELS[2] && Levels.LEVELS[2].width);
check("LEVELS[3].width is 6200", Levels.LEVELS[3] && Levels.LEVELS[3].width === 6200, Levels.LEVELS[3] && Levels.LEVELS[3].width);
window.__neon.loadLevel(1);
check("level 1 builds without enemies", Levels.platforms.every((p) => p.kind !== "enemy"));
check("no enemy draw calls remain", typeof Renderer.drawEnemy === "undefined");
```

Add the block-side-death check:

```js
// ---- Task 4: block side is lethal ----
window.__neon.loadLevel(3);
const p4 = Entities.player;
const wall = Levels.platforms.find((p) => p.kind === "block");
p4.x = wall.x - 20; p4.y = Levels.GROUND_Y - 46; p4.vy = 0; p4.vx = 0; p4.onGround = true; p4.invuln = 0;
Entities.gameState.dying = 0;
for (let i = 0; i < 30 && Entities.gameState.dying === 0; i++) Entities.update(0.016);
check("hitting a block side kills", Entities.gameState.dying > 0, "dying=" + Entities.gameState.dying);
// ---------------- end of task block ----------------
```

The reachability BFS already runs over `Levels.platforms` (which now includes blocks) with `AUTO_SPEED` — it validates every surface is reachable in all three new levels.

- [ ] **Step 7: Verify**

Preview: play all three levels from Start. Spikes kill on touch; block sides kill; block tops are safe landing spots; each level is beatable by holding jump and timing. The harness's reachability BFS passing proves no unjumpable gap. Console clean. If the BFS flags an unreachable surface, adjust that layout's block/gap coordinates (gap must be ≤ 200px, block climb ≤ 2 tiles per step) and re-run.

- [ ] **Step 8: Commit**

```bash
git add src/opencode/static/js/entities.js src/opencode/static/js/levels.js src/opencode/static/js/game.js src/opencode/static/tests/level3_smoke_runner.js
git commit -m "feat: lethal block sides and geometry-dash level layouts"
```

---

### Task 5: Neon visual restyle — cube, trail, grid floor, beat pulses, themes

**Files:**
- Modify: `src/opencode/static/js/renderer.js` (drawPlayer → drawCube with spin+glow, trail render, drawBackground → GD grid + beat pulse, drawSpikes → neon triangles, THEME-driven colors)
- Modify: `src/opencode/static/js/entities.js` (trail particle spawner in `update()`)
- Modify: `src/opencode/static/js/levels.js` (THEMES restyle to GD neon palettes)
- Modify: `src/opencode/static/js/audio.js` (expose `getBpm()` for beat sync)
- Modify: `src/opencode/static/tests/level3_smoke_runner.js` (beat + cube + theme checks)

**Interfaces:**
- Consumes: Tasks 1–4 (`player.angle`, `TILE`, themes, `Audio`).
- Produces: `Audio.getBpm()` returning the current track's bpm (or 120 if none), `Renderer` cube sprite + grid background, `gameState.theme` fields `sky`, `groundEdge`, `groundBody`, `groundTop`, `blockBody`, `blockEdge`, `spike`, `cube`, `cubeInner`, `trail`.

- [ ] **Step 1: audio.js — expose getBpm**

Add inside the module and to the return object:

```js
  function getBpm() {
    return musicTrack ? musicTrack.bpm : 120;
  }
```

```js
  return {
    ensureAudio, tone, sfx,
    playMusic, pauseMusic, stopMusic, musicActive,
    isSoundOn, toggleSound,
    getBpm,
  };
```

- [ ] **Step 2: entities.js — trail spawner**

In `update()`, inside the playing branch before `updateParticles(dt)`, add (via a helper near `dust`):

```js
  // GD-style trail: fading squares left behind the cube every ~30ms.
  function trail(x, y, color) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 20, life: 0.35, t: 0, color, size: 8, noGravity: true });
  }
```

Add the spawner inside `update()` directly after `updateMovement(dt)` (no state guard needed — `game.js` only calls `update()` while playing):

```js
    updateMovement(dt);
    player.trailT -= dt;
    if (player.trailT <= 0) {
      player.trailT = 0.03;
      trail(player.x + 4, player.y + player.h / 2, gameState.theme.trail);
    }
```

Make `updateParticles` skip gravity for `noGravity` particles:

```js
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      if (p.t >= p.life) { particles.splice(i, 1); continue; }
      if (!p.noGravity) p.vy += 500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
```

Add `trail` to the exports.

- [ ] **Step 3: renderer.js — drawCube**

Replace `drawPlayer` with:

```js
  // --- Cube (GD-style): spins in air, snaps to 90° on landing. ---
  function drawCube() {
    const col = gameState.theme.cube;
    const inner = gameState.theme.cubeInner;
    const size = 40;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
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
  }
```

In `draw()`, call `drawCube()` instead of `drawPlayer()`.

- [ ] **Step 4: renderer.js — GD background + grid floor + beat pulse**

Replace `drawBackground` with:

```js
  function drawBackground() {
    // Dark gradient (GD-style deep background).
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
```

Add `import { Audio } from "./audio.js";` to renderer.js's imports.

- [ ] **Step 5: renderer.js — neon spikes and ground**

Update `drawSpikes` to use theme colors + glow:

```js
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
```

Update `drawPlatforms` ground branch to the GD grid floor look:

```js
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
      }
```

- [ ] **Step 6: THEMES — GD neon palettes**

In `levels.js`, restyle the three themes (keep structure `{...THEME_BASE, ...}`):

```js
    1: {
      ...THEME_BASE,
      name: "Neon Meadows",
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
```

Update `THEME_BASE` to include the new fields with safe defaults (add `glow`, `spike`, `cube`, `cubeInner`, `trail` matching theme 1's values).

- [ ] **Step 7: Harness — cube, beat, theme checks**

Add:

```js
// ---- Task 5: visual API ----
check("Audio.getBpm exists", typeof Audio.getBpm === "function");
check("theme has cube color", !!Entities.gameState.theme.cube);
window.__neon.loadLevel(2);
check("level 2 theme is purple", Entities.gameState.theme.cube === "#e879f9");
// Angle snaps to the nearest 90 on landing (set a non-square angle, land, check).
const p5 = Entities.player;
p5.onGround = false; p5.angle = 123;
Entities.update(0.016); // airborne frame spins it further
p5.onGround = true;
Entities.update(0.016); // landing frame snaps it
check("cube angle snaps to 90 on landing", p5.angle % 90 === 0, "angle=" + p5.angle);
// ---------------- end of task block ----------------
```

(The harness's RAF loop runs between synchronous statements, so a couple of explicit `update()` calls are enough to force the snap deterministically.)

- [ ] **Step 8: Verify**

Preview: Start — the cube is a glowing square that spins in the air and snaps square on landing, trailing fading particles; background has a deep neon gradient, scrolling grid, and a glow that pulses on the beat of each track. Screenshot and visually confirm all three level themes. Harness PASS; console clean.

- [ ] **Step 9: Commit**

```bash
git add src/opencode/static/js/renderer.js src/opencode/static/js/entities.js src/opencode/static/js/levels.js src/opencode/static/js/audio.js src/opencode/static/tests/level3_smoke_runner.js
git commit -m "feat: neon geometry-dash visuals with cube spin and beat pulse"
```

---

### Task 6: Docs refresh + end-to-end verification + review

**Files:**
- Modify: `README.md` (game description, controls, scoring → GD-style, layout notes)
- Modify: `MODULES.md` (module table line counts, responsibilities, remove enemy mentions, harness description)
- Modify: `src/opencode/templates/index.html` (page title/badge copy if needed)
- Test: `src/opencode/static/tests/level3_smoke.html`

**Interfaces:** consumes all prior tasks.

- [ ] **Step 1: README.md — GD description**

Replace the game blurb ("classic side-scrolling platformer with **three levels**" intro and the Level bullets) with GD-style copy: auto-run, jump-only, no enemies, spikes/blocks, instant restart, attempts + percent, three themed levels. Replace the Controls table with:

```markdown
| Action        | Keys                                  |
| ------------- | ------------------------------------- |
| Jump          | `Space`, `↑`, `W`, or click — hold to keep bouncing |
| Pause         | `P` (or the ⏸ button)                 |
| Restart level | `R`                                   |
| Mute          | 🔊 button (remembered next visit)     |
```

Replace the Scoring section with:

```markdown
### Progress & attempts

- You die in **one hit** — spikes and block sides kill. The level restarts instantly.
- **Attempts** count every restart; **Best %** remembers your furthest run.
- **Coins** are optional collectibles — grab them all for bragging rights.
- Finish a level to advance; beat all three to win.
```

- [ ] **Step 2: MODULES.md**

Update the module table with fresh `wc -l` numbers and responsibilities (entities: auto-run physics, death beat, trail; levels: block/spike layouts; renderer: cube + grid + beat; game: attempts/percent/flow; audio: BGM + getBpm; input: jump-only). Update the dependency graph if imports changed (renderer now imports audio). Update the harness paragraph to describe GD-mode checks.

- [ ] **Step 3: Full harness run**

Navigate to `/static/tests/level3_smoke.html` — every line PASS. `preview_logs` clean.

- [ ] **Step 4: Fresh-checkout sanity**

```bash
cd /Users/sajid/Documents/code/code/ollama-code/opencode
uv run ruff check .
uv run opencode --port 5056 > /tmp/opencode-gd.log 2>&1 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5056/          # 200
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5056/static/tests/level3_smoke.html   # 200
kill %1
```

- [ ] **Step 5: Review**

Dispatch `code-reviewer-deepseek-flash` on the full diff (all six tasks). Fix findings, re-run affected verifications, then commit:

```bash
git add <fixed files>
git commit -m "fix: address review findings"
```

## Self-Review (completed at plan time)

**Spec coverage** — "style like Geometry Dash" ✓ (Tasks 1–5: auto-run, fixed jump, instant restart, attempts, percent bar, no enemies, spike/block hazards, neon cube visuals, beat pulse). "No/less enemies" ✓ (Task 3 removes all enemy systems and data). "Research the game style and suggest changes" ✓ (design rationale embedded per task; full research summary in the conversation). Docs ✓ (Task 6).

**Placeholder scan** — every step has complete code; no TBDs. The only open items are intentional: reachability-BFS failures would require adjusting coordinates (Step 7, Task 4 gives the rule: gaps ≤ 200px, climb ≤ 2 tiles/step) and `wc -l` numbers are re-measured in Task 6.

**Type consistency** — `AUTO_SPEED`/`TILE` replace `MOVE` everywhere including the harness BFS; `setCallbacks(onHurt, onWin, onHurtResolve)` is 3-arg in both `entities.js` and `game.js`; removed arrays (`enemies`, `keyItems`, `gates`, `lifePickups`, `projectiles`) are deleted from levels/entities/renderer/game in the same task (Task 3) so no dangling reference survives; `__neon` shape updated in Task 3; theme field names (`cube`, `cubeInner`, `trail`, `spike`, `glow`, `blockBody`, `blockEdge`) match between `levels.js` themes and `renderer.js` usage.
