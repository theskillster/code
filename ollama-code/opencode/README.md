# OpenCode — Neon Runner

A small Flask web app with a **playable 2D platformer** ("Neon Runner") built in
plain JavaScript on an HTML5 canvas — no game engines, no frameworks, no assets.
Run a single page, hit **Start**, and play.

Built with Python + Flask on the back end and hand-rolled canvas game code on the
front end.

---

## 🎮 The game

Neon Runner is a **Geometry Dash–style rhythm runner** with **three levels** —
auto-run, jump-only, no enemies:

**Level 1 — Neon Meadows** (4,800 px):

- Your cube **auto-runs**; the only input is jump
- Dodge **single spikes** and hop **block tiles** (block *sides* are lethal)
- Grab **coins** along the way

**Level 2 — The Voltage Vault** (5,100 px):

- Faster tempo, tighter rhythm — spikes and blocks alternate the whole way
- Mid-level **ground gap**: release to run, then time your jump over the pit

**Level 3 — Sunflare Ridge** (6,200 px):

- The final gauntlet: **two ground gaps**, a **low overhang** you must run
  under, and a **jump orb** floating over the second pit
- Memorize the rhythm. Beat it to win the game.

You die in **one hit** — spikes, block sides, and falling into pits kill. The
level restarts **instantly** from x=0. **Attempts** count every restart;
**Best %** remembers your furthest run. Coins are optional collectibles.

**Timing is the real enemy.** Levels now mix **ground gaps** (release to run
and time your jump over the pit), **low overhangs** (jump into one and you
shatter — run underneath instead), and **jump orbs** (tap mid-air on a glowing
ring to re-jump). Holding jump no longer clears a level — you have to feel the
rhythm.

### Controls

| Action        | Keys                                          |
| ------------- | --------------------------------------------- |
| Jump / hold   | `Space`, `↑`, `W`, or click — **hold to keep bouncing** |
| Release       | let go to run on the ground — **time gaps and slip under overhangs** |
| Orb tap       | tap `Space` mid-air on a glowing ring to **re-jump** |
| Pause         | `P` (or the ⏸ button)                         |
| Restart level | `R`                                           |
| Mute          | 🔊 button (remembered next visit)             |

On touchscreens, one big **TAP** button appears automatically.

### Progress & attempts

- You die in **one hit** — spikes, block sides, and pits kill. The level restarts instantly.
- **Attempts** count every restart; **Best %** remembers your furthest run.
- **Coins** are optional collectibles — grab them all for bragging rights.
- Finish a level to advance; beat all three to win.

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
                ├── audio.js    # WebAudio synth + procedural BGM (getBpm for beat sync)
                ├── input.js    # keyboard + touch controls (jump-only)
                ├── levels.js   # GD level data (ground/block/spike/coin), neon themes
                ├── entities.js # physics: auto-run, fixed jump, lethal block sides
                ├── renderer.js # cube + grid floor + beat pulses, canvas, HUD
                ├── game.js     # orchestrator: state machine, loop, attempts/percent
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
- **`templates/index.html`** — the game's markup: a HUD bar (coins / attempts /
  best % / progress bar), the `<canvas>`, an overlay for menu/pause/win, and a
  single touch jump button.
- **`static/js/main.js`** — bootstrap entry: imports `game.js`, which pulls in the full module graph (`audio → input → levels → entities → renderer`) as **native ES modules** — no bundler, no build step, no load-order bookkeeping. `base.html` loads only this one `<script type="module">`.
- **`static/tests/level3_smoke.html`** — browser-based smoke test (loads the modules against a stub DOM and asserts on real behavior). Open it in the running server; every line must print PASS.
- **`static/css/main.css`** — the dark neon theme and responsive layout.

## 🧠 Reading the code

Two complementary guides:

- **`MODULES.md`** — the current module architecture: dependency graph, per-module responsibilities and sizes, smoke-test harness, backend layout.
- **`explanation.md` / `explanation.html`** — a plain-text and an interactive visual walkthrough of the *original* monolithic engine (pre-module-split). Useful for understanding the game design; the code now lives across the six ES modules.
