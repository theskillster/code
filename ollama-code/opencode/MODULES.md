# OpenCode — Module Architecture

> Auto-generated reference. Update this file when adding or removing modules.

## JS module dependency graph

```
┌─────────────┐         ┌──────────────┐
│   audio.js  │         │   input.js   │
│ (no deps)   │         │ (no deps)    │
└──────┬──────┘         └──────┬───────┘
       │                       │
       │  sfx, ensureAudio     │  keys, bindInput
       │                       │
       ▼                       ▼
┌──────────────────────────────────────────────┐
│              levels.js                       │
│  (no deps — pure data + helpers)             │
│  Exports: scene arrays, LEVELS, THEMES,      │
│           constants, clearScene, builder fns │
└──────┬───────────────────────────────┬───────┘
       │                               │
       │  platforms, coins, enemies,   │  platforms, coins, enemies,
       │  projectiles, spikes, keys,   │  projectiles, spikes, keys,
       │  gates, flag, constants       │  gates, flag, constants
       │                               │
       ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  entities.js     │          │  renderer.js     │
│  (physics,       │          │  (all draw fns)  │
│   player,        │          │  canvas setup,   │
│   particles,     │          │  HUD, sprites)   │
│   update logic)  │          │                  │
└──────┬───────────┘          └────────┬─────────┘
       │                               │
       │  player, gameState,           │  draw, updateHUD, els
       │  update, updateCamera,        │
       │  resetPlayer, particles       │
       │                               │
       ▼                               ▼
┌──────────────────────────────────────────────┐
│                 game.js                       │
│  (orchestrator: state machine, flow control,  │
│   game loop, wiring, init)                   │
│  Wires: setCallbacks → entities.js            │
│         bindInput → input.js                  │
│         button events → renderer.js els       │
└──────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────┐
│               main.js                         │
│  (thin loader — just a log + no-op guard)    │
└──────────────────────────────────────────────┘
```

## Module sizes

| Module | Lines | Responsibility |
|--------|-------|---------------|
| `audio.js` | 219 | WebAudio synth — `ensureAudio()`, `tone()`, `sfx` (incl. `sfx.life` chime), procedural BGM (`playMusic`/`pauseMusic`/`stopMusic`, 3 per-level tracks) |
| `input.js` | 85 | Keyboard + touch input — `keys`, `bindInput()` |
| `levels.js` | 391 | Level data (3 levels — 3 adds the darter & life-heart enemies), themes (base+overrides), constants, seeded PRNG, builder helpers |
| `entities.js` | 476 | Physics, player, collisions, particles, 14 update systems (incl. darter state machine + `updateLives`) |
| `renderer.js` | 550 | All draw functions, canvas setup, HUD (incl. `drawDarter`, `drawLifePickups`) |
| `game.js` | 379 | State machine, game loop, wiring, init, safe respawn, overlay countdowns, per-level intro copy, BGM control |
| `main.js` | 26 | Thin loader |
| **Total** | **2,126** | |

## Load order (defined in `templates/base.html`)

```
audio.js → input.js → levels.js → entities.js → renderer.js → game.js → main.js
```

Each module is an IIFE that exposes a single global (`Audio`, `Input`, `Levels`, `Entities`, `Renderer`, `Game`). Dependencies are resolved through script loading order — `game.js` is last and coordinates everything.

## Smoke-test harness

`static/tests/level3_smoke.html` loads all six modules against a stub DOM and asserts on the real globals: level geometry (width, coin/checkpoint counts, jump-reachability BFS over the physics constants), darter behavior (wait → windup → dash, stomp vs. hurt), life-heart collection + HUD cap, track-3 startup, and the win → level-3-intro flow. Run it at `/static/tests/level3_smoke.html` in the running preview server.

## Python backend

```
wsgi.py  (7 lines)
  └── src/opencode/__init__.py  (15 lines) — create_app() factory
       └── src/opencode/routes.py  (8 lines) — blueprint: GET /
            └── templates/base.html – layout shell
                 └── templates/index.html – game page markup
```

Backend total: **45 lines** across 4 files. The server's only job is to serve the game page and static assets.