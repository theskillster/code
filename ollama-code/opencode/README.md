# OpenCode — Neon Runner

A small Flask web app with a **playable 2D platformer** ("Neon Runner") built in
plain JavaScript on an HTML5 canvas — no game engines, no frameworks, no assets.
Run a single page, hit **Start**, and play.

Built with Python + Flask on the back end and hand-rolled canvas game code on the
front end.

---

## 🎮 The game

Neon Runner is a classic side-scrolling platformer with **three levels**:

**Level 1 — Neon Meadows** (5,120 px):

- Run, jump, and **stomp enemies** to clear them
- **Collect 30 coins** scattered across the level
- Dodge **spike traps** and bottomless gaps
- Reach the waving flag at the end to win

**Level 2 — The Voltage Vault** (4,600 px, unlocked after Level 1):

- Harder: spike landings, wider-feeling jumps, **faster patrolling enemies**
- New enemy: **volts** — electric flyers that bob up and down over gaps and guard treasures
- New feature: **keys & gates** — locked gates block your path until you grab their key

**Level 3 — Sunflare Ridge** (6,200 px, unlocked after Level 2):

- The longest level: **dashing darters** (telegraph, then charge), flying volts, plasma turrets, and two key/gate pairs
- New pickups: **life hearts** restore an extra life (max 6)
- Brightest palette and fastest BGM track yet

All three levels share **3 lives** (score and lives carry over between levels); falling
into a pit or touching an enemy/spike costs one. Finish a level fast for a **time
bonus**, and your **best total score** is saved between visits.

### Controls

| Action        | Keys                                  |
| ------------- | ------------------------------------- |
| Move left     | `←` or `A`                            |
| Move right    | `→` or `D`                            |
| Jump          | `Space`, `↑`, or `W` (hold = higher)  |
| Pause         | `P` (or the ⏸ button)                 |
| Restart       | `R`                                   |
| Mute          | 🔊 button (remembered next visit)     |

On touchscreens, on-screen ◀ ▶ ⬆ buttons appear automatically.

### Scoring

| Action          | Points  |
| --------------- | ------- |
| Coin            | +10     |
| Stomp an enemy  | +50     |
| Collect a key   | +100    |
| Time bonus      | up to +300 per level (300 − seconds, min 0) |

---

## 🏗️ Tech stack

- **Python 3.12** + [Flask](https://flask.palletsprojects.com/) + Jinja2
- [uv](https://docs.astral.sh/uv/) for dependency management
- [Ruff](https://docs.astral.sh/ruff/) for linting & formatting
- Vanilla JavaScript (Canvas 2D API) + CSS — no external libraries

## 📁 Layout

```
.
├── pyproject.toml            # project metadata, deps, ruff config, console script
├── uv.lock                   # locked dependency graph
├── wsgi.py                   # WSGI entry: `app = create_app()`; `python wsgi.py` serves via Waitress
├── .python-version           # pinned Python version
├── README.md                 # this file
├── explanation.md            # plain-text walkthrough of the ORIGINAL monolithic engine
├── explanation.html          # rich visual walkthrough of the ORIGINAL monolithic engine
└── src/
    └── opencode/
        ├── __init__.py       # create_app() factory + main() (argparse → Waitress)
        ├── routes.py         # main Blueprint → renders index.html
        ├── templates/
        │   ├── base.html     # page shell (single <script type="module">)
        │   └── index.html    # game page: HUD, canvas, overlay, touch buttons
        └── static/
            ├── css/main.css  # page + game styling (dark neon theme)
            └── js/           # the game — six ES modules + bootstrap
                ├── audio.js    # WebAudio synth + procedural BGM
                ├── input.js    # keyboard + touch controls
                ├── levels.js   # level data, themes, constants, builders
                ├── entities.js # physics, player, enemies, update systems
                ├── renderer.js # all draw functions, canvas, HUD
                ├── game.js     # orchestrator: state machine, loop, wiring
                └── main.js     # bootstrap entry (loads the module graph)
```

## 🚀 Setup

Requires `uv` (install via `brew install uv`).

```sh
uv sync                                # install dependencies into .venv
uv run opencode                        # start server → http://127.0.0.1:5000
uv run opencode --port 5055            # ...or any free port
```

The server uses **Waitress** (production WSGI), which is reliable on macOS
where the Flask dev server crashes. Then open <http://127.0.0.1:5000> and
press **Start**.

## 🔧 Useful commands

```sh
uv add <package>             # add a runtime dependency
uv add --dev <package>       # add a dev dependency
uv run ruff check .          # lint
uv run ruff format .         # format
```

## 🧩 How the pieces fit

- **`routes.py`** — a single route (`/`) that renders `index.html`; all the game
  logic lives in the browser.
- **`templates/index.html`** — the game's markup: a HUD bar (score / coins /
  lives / best / time), the `<canvas>`, an overlay for menu/pause/win/game-over,
  and the touch buttons.
- **`static/js/main.js`** — bootstrap entry: imports `game.js`, which pulls in the full module graph (`audio → input → levels → entities → renderer`) as **native ES modules** — no bundler, no build step, no load-order bookkeeping. `base.html` loads only this one `<script type="module">`.
- **`static/tests/level3_smoke.html`** — browser-based smoke test (loads the modules against a stub DOM and asserts on real behavior). Open it in the running server; every line must print PASS.
- **`static/css/main.css`** — the dark neon theme and responsive layout.

## 🧠 Reading the code

Two complementary guides:

- **`MODULES.md`** — the current module architecture: dependency graph, per-module responsibilities and sizes, smoke-test harness, backend layout.
- **`explanation.md` / `explanation.html`** — a plain-text and an interactive visual walkthrough of the *original* monolithic engine (pre-module-split). Useful for understanding the game design; the code now lives across the six ES modules.
