# OpenCode — Main Executable Explained

> **⚠ Stale — historical document.** This walkthrough describes the **original**
> monolithic engine (single `main.js`, 1,412 lines) and the pre-refactor server
> layout (45 lines, `flask --app wsgi run`). The game now lives across **six
> ES modules** under `src/opencode/static/js/` and the server runs via
> `uv run opencode` (Waitress). See `MODULES.md` and `README.md` for the
> current architecture. Kept for the game-design narrative.

> **Project:** OpenCode (Neon Runner) — a Flask web app that serves a playable 2D canvas platformer.  
> **Entry point:** `wsgi.py` (7 lines)  
> **Server code total:** 45 lines across 4 files  
> **Game engine:** `main.js` — 1,412 lines of vanilla JavaScript

---

## 1. The entry point: `wsgi.py`

```python
from opencode import create_app

app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
```

**What each line does:**

| Line | Role |
|------|------|
| 1 | Import the app factory from the `opencode` package (lives in `src/opencode/`) |
| 3 | Build the Flask app at import time — this is the `app` object that WSGI servers and the Flask CLI discover |
| 6–7 | Guarded direct-run block: only runs when you execute `python wsgi.py` directly. Launches Werkzeug's dev server on `127.0.0.1:5000` with debug mode on |

**The factory pattern** (`create_app()`) keeps the import side-effect free — nothing runs until the app is actually built.

---

## 2. Two (really three) ways the executable starts

### Path A — Flask CLI (recommended dev command)
```
uv run flask --app wsgi run --debug
```
The CLI imports `wsgi`, finds the `app` object, and runs it.

### Path B — Direct script
```
python wsgi.py
```
Executes line 7, calls `app.run(debug=True)`. Same result, different mental model.

### Path C — Production WSGI server
```
gunicorn wsgi:app
```
Tools like gunicorn/uWSGI import the module, grab `app`, and serve behind a production-grade server. No debugger, no reloader. The file doesn't need to change — that's the whole point of the factory pattern.

---

## 3. Request lifecycle (GET /)

```
Browser → WSGI server → Flask app → main blueprint → index() → Jinja2 → HTML page
                                                                       ↓
                                                            Browser loads CSS + JS
                                                                       ↓
                                                          Game runs client-side
```

**What the browser actually loads:**
1. `css/main.css` — dark neon theme, HUD, layout (~315 lines)
2. `js/main.js` — the entire game engine: physics, levels, enemies, audio synth, render loop (~1,412 lines)
3. After that, the connection goes quiet: the game runs **entirely client-side** with `requestAnimationFrame`, and persistence uses `localStorage`, not the server.

---

## 4. The app map

```
wsgi.py                          — entry point (builds app, exposes `app`)
└── src/opencode/__init__.py     — app factory (create_app): folders + blueprint
    ├── routes.py                — blueprint: single route GET / → index.html
    ├── templates/base.html      — layout shell: head, header, CSS/JS links
    │   └── templates/index.html — game page: HUD + canvas + overlay + touch buttons
    ├── static/css/main.css      — dark neon theme (~315 lines)
    └── static/js/main.js        — the game engine (1,412 lines)
```

**Server-side code total:** 45 lines across 4 files:
- `wsgi.py` — 7 lines
- `__init__.py` — 15 lines
- `routes.py` — 8 lines
- `base.html` — 18 lines
- `index.html` — 48 lines (Jinja template, rendered on server)

---

## 5. The game engine (`main.js`)

### The heartbeat loop
```
requestAnimationFrame(loop)
  → clamp dt (capped at 1/30s to survive tab-switch spikes)
  → update(dt) — physics, input, collisions, enemy AI (only in "playing" state)
  → updateCamera — follows player, clamped to level bounds
  → draw() — background, platforms, entities, particles, vignette
  → updateHUD — sync DOM score/coins/lives/time
  → back to rAF
```

### Game states
The whole app is a tiny state machine driven by one variable, `state`:

| State | What happens |
|-------|-------------|
| **menu** | Boot: `loadLevel(1)` + overlay with Start. Pressing it calls `start()` |
| **playing** | The only state where `update(dt)` runs. Input, physics, coins, enemies, bolts, spikes, flag, checkpoints |
| **paused** | Loop keeps drawing but never updates. Triggered by P/Esc or the ⏸ button. Auto-pauses on tab hide |
| **win** | Flag reached: time bonus `max(0, 300 − seconds)`, best score saved to localStorage, confetti + jingle |
| **over** | Lives hit 0: shows final score vs. best. Try again restarts fresh |

### Physics constants
- `GRAV = 2300` pixels/s²
- `MOVE = 340` pixels/s
- `JUMP_V = 800` pixels/s
- `MAX_FALL = 1300` pixels/s
- **Coyote time:** 0.09s — you can still jump briefly after walking off a ledge
- **Jump buffering:** 0.12s — press jump slightly before landing and it still fires

### Three enemy types
1. **Walkers** — patrol between `min`/`max` bounds, stompable from above
2. **Flyers** (volts) — bob sinusoidally, introduced in Level 2
3. **Shooters** (turrets) — track the player's position, fire plasma bolts when in range

### Levels as data
Levels aren't art assets — they're coordinate arrays built by plain functions. Example from Level 2 ("The Voltage Vault"):
```javascript
ground(1540, 360);
spike(1630, 44);
shooter(1680, 1590, 1820, 2.6, 320);   // plasma turret
flyer(1910, 1905, 1995, 390, 40, 2.0, 0);  // volt guarding the gap
key(2575, 330, "A");                    // key A unlocks gate A
gate(2700, 300, "A");
```

---

## 6. Findings & gotchas

### ⚠ Broken console script
`pyproject.toml` declares `[project.scripts] opencode = "opencode:main"`, but `src/opencode/__init__.py` only defines `create_app` — **no `main` function exists**. Installing the package creates an `opencode` command that crashes on launch. The working entry is `wsgi.py` (via `flask --app wsgi run`).

### ⚠ README understates the game
The README says `main.js` is "~550 lines of canvas JavaScript". It's actually **1,412 lines** — nearly 3×. The file has grown with Level 2 (turrets, flyers, keys/gates, projectiles).

### ℹ src-layout needs PYTHONPATH
The package lives in `src/` and isn't necessarily installed into the venv. The README suggests `PYTHONPATH=src uv run flask --app wsgi run` as a fallback. `uv sync` normally installs the local package, making this unnecessary.

### ℹ Debug mode = dev only
`app.run(debug=True)` (line 7) enables the Werkzeug debugger — handy locally, dangerous if ever exposed publicly. Production should use `wsgi:app` behind gunicorn/uWSGI.

### ℹ Everything is client-side
After the initial page load there is **no backend interaction at all** — no APIs, no POST routes, no database. Persistence (best score, sound preference) is `localStorage` in the browser. The Python layer is 45 lines total; the game is 1,412.

---

*Generated analysis · OpenCode (Neon Runner) · entry point `wsgi.py` → 45 lines of server code → 1,412 lines of game*