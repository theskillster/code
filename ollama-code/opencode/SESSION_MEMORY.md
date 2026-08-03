# Neon Runner — Session Memory (for tomorrow)

> A working-memory file so the next session can pick up instantly. Written at the
> end of the session that built the game and added Level 2. Everything below was
> verified **live in the browser** before writing this.

---

## 1. What this project is

A tiny Flask app (`ollama-code/opencode/`) whose only real content is a playable
**2D neon platformer, "Neon Runner"**, rendered on an HTML5 `<canvas>` with
**vanilla JS** — no game engine, no frameworks, no audio/image assets.

- Backend: one route (`routes.py`) → renders `index.html`. All logic is client-side.
- The whole game lives in `src/opencode/static/js/main.js` (~600 lines, one IIFE).
- Docs: `README.md` (project overview + controls + scoring) and
  `explanation.md` (friendly code walkthrough). Both are up to date and
  describe **two levels**.
- The repo's top-level README (`/README.md`) is the workspace overview and does
  **not** mention the game — nothing to do there unless asked.

## 2. Current state of the game (VERIFIED working)

A **two-level campaign** with shared lives (3) and a carry-over score:

| | Level 1 — Neon Meadows | Level 2 — The Voltage Vault |
|---|---|---|
| width | 5120 px | 4600 px |
| coins | 30 | 28 |
| theme | blue/cyan sky | purple/violet sky |
| new stuff | — | **keys & gates**, **flying "volt" enemies**, faster walkers, spikes right after landings |

Flow: beat Level 1 → "Next level ▶" → intro overlay → Level 2 → beat Level 2 →
"You beat the game! 🏆" → "Play again".

### Mechanics
- Move `←/→` or `A/D`, jump `Space/↑/W` (hold = higher), `P` pause, `R` restart.
- Gravity 2300, move speed 340, jump -800, max fall 1300, coyote 0.09s,
  jump buffer 0.12s, invuln 2.2s.
- Coins +10, stomp +50, key +100, time bonus up to +300 per level.
- Best score persisted in `localStorage` under `opencode-best` (safe
  `lsGet`/`lsSet` wrappers); sound pref under `opencode-sound`.
- **Pit falls always cost a life and respawn** — even mid-invulnerability. This
  was a soft-lock bug that was caught in review and fixed (falling into a pit
  during the blink window used to freeze the game forever).
- Checkpoints are hard-coded x-positions, each verified to sit on solid ground.
- 2D collisions: X pass pushes out sideways; Y pass is **sub-stepped** in ≤12px
  chunks so fast falls can't tunnel through 26px-thick platforms.

## 3. Level 2 details (keys & gates system)

- `key(x, y, label)` drops a glowing key; `gate(x, h, label)` places a solid
  wall on the ground. Collecting a key opens **every gate with the same label**.
- Level 2 has gate **A** at x=2700 (key at ~2575, guarded by a volt flyer) and
  gate **B** at x=3600 (key at ~3520, also flyer-guarded).
- Gates act as solid walls until opened (collision check skips `opened` gates);
  opening plays a slide-up/fade animation + `sfx.gate()` buzzer.
- Flyers patrol horizontally like walkers but also **bob on a sine wave**
  (`y = baseY + sin(animTime * bobSpeed + phase) * amp`). Same stomp rules.
- HUD gained a 🔒/🔑 indicator (`hud-key`) and a level readout (`hud-level`).

## 4. How the code is organized (main.js)

1. **Setup** — canvas sizing (HiDPI-aware, DPR capped at 2), DOM refs, safe
   localStorage wrappers.
2. **Audio** — tiny WebAudio synth: `tone(freq, dur, type, vol, slide, delay)`;
   `sfx` object with one-liners (jump, coin, key, gate, stomp, hurt, win, level, over).
3. **Input** — keyboard `KEYMAP` (Arrow/AD + Space/Up/W), jump buffering flag,
   variable jump height on keyup, touch buttons via `pointerdown/up`.
4. **Level data** — helper builders (`ground`, `plat`, `coin`, `enemy`, `flyer`,
   `spike`, `key`, `gate`, `coinArc`), `THEMES` palettes, and a `LEVELS` object
   (name, width, flagX, checkpoints, `build()`). This is the "level designer".
5. **Game state** — player object, lives/score/time, `state` machine
   (`menu | playing | paused | win | over`), checkpoint.
6. **Flow control** — `loadLevel(n)`, `resetPlayer()`, `start()`, `enterLevel()`,
   `playLevel(n)` (dev hook), `nextLevel()`, `togglePause()`, `hurt(fell)`,
   `win()`, `gameOver()`.
7. **update(dt)** — input → X collision → jump → sub-stepped Y collision →
   gates → coins → keys/gates → enemies (patrol + stomp) → spikes → pit check →
   flag check → checkpoints.
8. **draw()** — parallax sky/stars/moon/clouds/hills, platforms, spikes, gates,
   coins, keys, flag, enemies, player, particles, vignette.
9. **Loop** — `requestAnimationFrame`, dt clamped to 1/30s.
10. **Dev hook** — `window.__neon = { playLevel, loadLevel, start, player }`
    so levels can be exercised from the console / preview `evaluate`.

## 5. Verified live this session (all passed)

- Page serves at `http://127.0.0.1:5010` (port 5000 is taken by ControlCe on
  this machine — **use 5010**). Run with `PYTHONPATH=src .venv/bin/python -m
  flask --app wsgi run --port 5010` from `ollama-code/opencode/`.
- Level 1 → flag → "Level 1 complete!" overlay → "Next level ▶" → Level 2 intro
  ("Level 2 — The Voltage Vault") → "Enter ▶" → Level 2 plays, score carries over.
- Gate A blocks the player (stopped at x=2666, gate at 2700).
- Key A collected → 🔑 HUD, +100, gate opens, player passes through (x>2730).
- Level 2 flag → "You beat the game! 🏆" final screen with score + best.
- One life lost in testing was caused by teleporting onto a guarding flyer —
  expected behavior, not a bug.

## 6. Next-step ideas (not started)

- A **Level 3** (e.g., an ice/lava theme) using the same `LEVELS`/`THEMES`
  pattern — just add `3:` entries and bump `totalLevels`.
- Level select / "continue from Level N" on the menu.
- Pause menu polish, mute persistence icon state, better mobile layouts.
- New enemy kinds (shooter, chaser, crusher) by extending the `kind` switch.
- A hard mode (faster enemies, fewer lives) or speedrun timer.
- Note: no test framework exists; validation is manual via the preview +
  `window.__neon` dev hook.

## 7. Gotchas / tips for the next session

- The uncommitted game work shows in `git status` (modified README/explanation/
  main.js/main.css/index.html). The last commit touching it is
  `bc83cb6 used freebuff to create game in opencode folder`. Don't commit unless
  asked.
- `preview_evaluate` runs in an isolated world: synthetic keyboard events don't
  reach the game. To drive input, **inject a main-world helper** by appending a
  `<script>` element (defines `window.__drive(keys, ms)` dispatching real
  `KeyboardEvent`s, and `window.__teleport(x, y)`).
- The game canvas is 960×540 logical; camera scrolls a level up to 5120px wide.
- `fontFamily`/Excalifont note applies only to the Excalidraw skill's output —
  not this game.
