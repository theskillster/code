# OpenCode — Neon Runner

A small Flask web app with a **playable 2D platformer** ("Neon Runner") built in
plain JavaScript on an HTML5 canvas — no game engines, no frameworks, no assets.
Run a single page, hit **Start**, and play.

Built with Python + Flask on the back end and hand-rolled canvas game code on the
front end.

---

## 🎮 The game

Neon Runner is a classic side-scrolling platformer:

- Run, jump, and **stomp enemies** to clear them
- **Collect 30 coins** scattered across a 5,120 px level
- Dodge **spike traps** and bottomless gaps
- Reach the waving flag at the end to win
- **3 lives**; falling into a pit or touching an enemy/spike costs one
- Time bonus for finishing fast, **best score saved** between visits

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
| Time bonus      | up to +300 (300 − seconds, min 0) |

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
├── explanation.md            # friendly walkthrough of how the code works
└── src/
    └── opencode/
        ├── __init__.py       # create_app() factory (templates + static paths)
        ├── routes.py         # main Blueprint → renders index.html
        ├── templates/
        │   ├── base.html     # page shell (header, footer, script tags)
        │   └── index.html    # game page: HUD, canvas, overlay, touch buttons
        └── static/
            ├── css/main.css  # page + game styling (dark neon theme)
            └── js/main.js    # THE GAME — ~550 lines of canvas JavaScript
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

Start with [`explanation.md`](./explanation.md) — it explains the game code
section by section in plain language, with no prior game-dev knowledge required.
