# OpenCode — Module Architecture

> Auto-generated reference. Update this file when adding or removing modules.

## JS module dependency graph

```
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
┌──────────────────┐          ┌─────────────────────┐
│  entities.js     │          │  renderer.js        │
│  (physics,       │          │  (all draw fns,     │
│   update logic)  │          │   canvas, HUD)      │
└──────┬───────────┘          │   imports audio.js  │
       │                      │   for beat sync     │
       │                      └────────┬────────────┘
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
| `audio.js` | 225 | WebAudio synth — `ensureAudio()`, `tone()`, `sfx`, procedural BGM (3 per-level tracks), `getBpm()` for beat-synced visuals |
| `input.js` | 72 | Keyboard + touch input — jump-only `keys`, `bindInput()` |
| `levels.js` | 310 | GD level data (3 levels: ground/block/spike/coin layouts), neon themes, constants |
| `entities.js` | 336 | Physics: auto-run, fixed-height jump, lethal block sides, particles, trail, death beat |
| `renderer.js` | 240 | All draw functions — spinning cube, grid floor, beat pulse, neon spikes/blocks, HUD (coins/attempts/best/progress) |
| `game.js` | 300 | State machine, game loop, instant-restart + attempts/percent, overlay countdowns, per-level intro copy, BGM control |
| `main.js` | 6 | Bootstrap entry — imports `game.js` |
| **Total** | **1,489** | |

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
auto-run + fixed-height jump + cube spin, instant-restart death loop with
attempts and percent, absence of enemies/keys/gates/hearts, lethal block sides
vs. safe block tops, per-level jump-reachability BFS over the physics
constants, and the visual API (themes, `Audio.getBpm`, angle snap). Run it at
`/static/tests/level3_smoke.html` in the running preview server (module
scripts need http, not file://).

## Python backend

```
pyproject.toml        — metadata, deps (flask, waitress), ruff config, console script
wsgi.py               — WSGI entry: `app = create_app()`; `python wsgi.py` serves via Waitress
src/opencode/__init__.py — create_app() factory + main() (argparse → Waitress)
src/opencode/routes.py   — blueprint: GET /
templates/base.html      — layout shell (single <script type="module">)
templates/index.html     — game page markup
```

Backend Python total: **50 lines** across 3 files (`wsgi.py` 8 + `__init__.py` 34 + `routes.py` 8). Run it with **one command**:

```sh
uv run opencode --port 5000
```