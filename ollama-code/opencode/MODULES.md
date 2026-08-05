# OpenCode — Module Architecture

> Auto-generated reference. Update this file when adding or removing modules.

## JS module dependency graph

```
┌─────────────┐         ┌──────────────┐
│   audio.js  │         │   input.js   │
│ (no deps)   │         │ (no deps)    │
└──────┬──────┘         └──────┬───────┘
       │                       │
       ▼                       ▼
┌──────────────────────────────────────────────┐
│              levels.js                       │
│  (no deps — pure data + helpers)             │
└──────┬───────────────────────────────┬───────┘
       │                               │
       ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  entities.js     │          │  renderer.js     │
│  (physics,       │          │  (all draw fns)  │
│   update logic)  │          │  canvas, HUD)    │
└──────┬───────────┘          └────────┬─────────┘
       │                               │
       ▼                               ▼
┌──────────────────────────────────────────────┐
│                  game.js                      │
│  (orchestrator: state machine, loop, wiring)  │
└──────────────────────┬───────────────────────┘
                       │  import
                       ▼
┌──────────────────────────────────────────────┐
│               main.js (bootstrap)            │
│  single <script type="module"> in base.html  │
└──────────────────────────────────────────────┘
```

## Module sizes

| Module | Lines | Responsibility |
|--------|-------|---------------|
| `audio.js` | 219 | WebAudio synth — `ensureAudio()`, `tone()`, `sfx` (incl. `sfx.life` chime), procedural BGM (`playMusic`/`pauseMusic`/`stopMusic`, 3 per-level tracks) |
| `input.js` | 85 | Keyboard + touch input — `keys`, `bindInput()` |
| `levels.js` | 391 | Level data (3 levels), themes (base+overrides), constants, seeded PRNG, builder helpers |
| `entities.js` | 484 | Physics, player, collisions, particles, 14 update systems (incl. darter state machine + `updateLives`) |
| `renderer.js` | 553 | All draw functions, canvas setup, HUD (incl. `drawDarter`, `drawLifePickups`) |
| `game.js` | 385 | State machine, game loop, wiring, init, safe respawn, overlay countdowns, per-level intro copy, BGM control |
| `main.js` | 6 | Bootstrap entry — imports `game.js` |
| **Total** | **2,123** | |

## Module loading (ES modules)

`base.html` loads exactly one script:

```html
<script type="module" src=".../js/main.js"></script>
```

`main.js` imports `game.js`, which imports the other five. Dependencies are
**explicit `import` statements** — no script-tag ordering, no global
namespace. Adding a module = create the file + import it where needed;
no HTML edits.

## Smoke-test harness

`static/tests/level3_smoke.html` loads `level3_smoke_runner.js`, a module that
imports the six game modules against a stub DOM and asserts on real behavior:
level geometry (width, coin/checkpoint counts, jump-reachability BFS over the
physics constants), darter behavior (wait → windup → dash, stomp vs. hurt),
life-heart collection + HUD cap, track-3 startup, and the win → level-3-intro
flow. Run it at `/static/tests/level3_smoke.html` in the running preview
server (module scripts need http, not file://).

## Python backend

```
pyproject.toml        — metadata, deps (flask, waitress), ruff config, console script
wsgi.py               — WSGI entry: `app = create_app()`; `python wsgi.py` serves via Waitress
src/opencode/__init__.py — create_app() factory + main() (argparse → Waitress)
src/opencode/routes.py   — blueprint: GET /
templates/base.html      — layout shell (single <script type="module">)
templates/index.html     — game page markup
```

Backend total: ~50 lines across 5 files. Run it with **one command**:

```sh
uv run opencode --port 5000
```