# OpenCode — Neon Runner

A small Flask web app with a **playable 2D platformer** ("Neon Runner") built in
plain JavaScript on an HTML5 canvas — no game engines, no frameworks, no assets.
Run a single page, hit **Start**, and play.

Built with Python + Flask on the back end and hand-rolled canvas game code on the
front end.

---

## 🎮 The game

Neon Runner is a classic side-scrolling platformer with **two levels**:

**Level 1 — Neon Meadows** (5,120 px):

- Run, jump, and **stomp enemies** to clear them
- **Collect 30 coins** scattered across the level
- Dodge **spike traps** and bottomless gaps
- Reach the waving flag at the end to win

**Level 2 — The Voltage Vault** (4,600 px, unlocked after Level 1):

- Harder: spike landings, wider-feeling jumps, **faster patrolling enemies**
- New enemy: **volts** — electric flyers that bob up and down over gaps and guard treasures
- New feature: **keys & gates** — locked gates block your path until you grab their key

Both levels share **3 lives** (score and lives carry over between levels); falling
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
├── pyproject.toml            # project metadata, deps, ruff config
├── uv.lock                   # locked dependency graph
├── wsgi.py                   # entry point: `flask --app wsgi run`
├── .python-version           # pinned Python version
├── README.md                 # this file
├── explanation.md            # plain-text walkthrough of the code (Markdown)
├── explanation.html          # rich visual walkthrough (interactive, open in browser)
└── src/
    └── opencode/
        ├── __init__.py       # create_app() factory (templates + static paths)
        ├── routes.py         # main Blueprint → renders index.html
        ├── templates/
        │   ├── base.html     # page shell (header, footer, script tags)
        │   └── index.html    # game page: HUD, canvas, overlay, touch buttons
        └── static/
            ├── css/main.css  # page + game styling (dark neon theme)
            └── js/main.js    # THE GAME — ~1,412 lines of canvas JavaScript
```

## 🚀 Setup

Requires `uv` (install via `brew install uv`).

```sh
uv sync                              # install dependencies into .venv
uv run flask --app wsgi run --debug  # start the dev server
```

If the `opencode` package isn't installed into the venv yet (src layout), add the
source directory to the path:

```sh
PYTHONPATH=src uv run flask --app wsgi run
```

Then open <http://127.0.0.1:5000> and press **Start**.

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
- **`static/js/main.js`** — the entire game: physics, collision, level data,
  enemies, coins, particles, sound synthesis, input handling, and the render
  loop. Read `explanation.md` for a guided tour.
- **`static/css/main.css`** — the dark neon theme and responsive layout.

## 🧠 Reading the code

Two complementary guides:

- **`explanation.md`** — plain-text walkthrough in Markdown, readable in any
  editor or on GitHub. Covers the main executable, server-side files, game
  engine, states, and findings.
- **`explanation.html`** — rich visual walkthrough with interactive diagrams
  (request flow, file tree, state machine, game loop), syntax-highlighted code
  tabs, and animated SVGs. Open in your browser: `open explanation.html`.

Both explain the same code: the entry point, the Flask app factory, the single
route, and the 1,412-line front-end game engine.
