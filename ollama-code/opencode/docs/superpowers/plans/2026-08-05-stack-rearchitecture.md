# Stack Re-architecture Implementation Plan (ES Modules + One-Command Run)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-architect the OpenCode (Neon Runner) stack so the frontend modules are load-order-independent and the dev server runs from a single, reliable, documented command.

**Architecture:** Convert the six IIFE-global JS modules (`Audio`, `Input`, `Levels`, `Entities`, `Renderer`, `Game`) to native ES modules — `base.html` loads exactly one `<script type="module">` pointing at `main.js`, and every cross-module dependency becomes an explicit `import`. On the backend, make the existing `opencode` console script (`pyproject.toml` `[project.scripts]`) the one true launcher: `uv run opencode [--host H] [--port P]` serves via Waitress (macOS-safe) with Flask as fallback, replacing the fragile `flask run` / `.freebuff/launch_server.py` paths. Update `run.md`, `README.md`, and `MODULES.md` to match reality.

**Tech Stack:** Python 3.12 + Flask + Waitress (managed by uv), Ruff; vanilla JS with **native ES modules** (no bundler, no Node — the machine has no Node and the project is deliberately zero-toolchain). Tests are browser-based (`static/tests/level3_smoke.html`), the existing pattern.

## Global Constraints

- **No Node.js, no npm, no bundlers, no new runtime deps.** This machine has no Node (`command -v node` → none). Everything must stay browser-native + uv/Python.
- **Zero new Python dependencies.** `flask` and `waitress` are already in `pyproject.toml`; `ruff` already in `[dependency-groups] dev`.
- **Default port 5000**, override with `--port`; the launcher must not hardcode the port in more than one place.
- **All six module names (`Audio`, `Input`, `Levels`, `Entities`, `Renderer`, `Game`) stay as exported module namespaces** so the smoke-test harness assertions keep working with minimal edits.
- **`window.__neon` dev hook must keep working** — the smoke test drives it via `playLevel`/`loadLevel`.
- **Game behavior must not change** — this is a structural refactor; physics, levels, audio, and UI stay byte-identical except for module plumbing.
- Script tags in `base.html` must collapse to exactly one `<script type="module">`.
- Commit each task separately with the project's style (`refactor:`, `docs:`), staging only the files each task touches (never `git add -A`).

---

### Task 1: Convert the six JS modules to native ES modules

**Files:**
- Modify: `src/opencode/static/js/audio.js`
- Modify: `src/opencode/static/js/input.js`
- Modify: `src/opencode/static/js/levels.js`
- Modify: `src/opencode/static/js/entities.js`
- Modify: `src/opencode/static/js/renderer.js`
- Modify: `src/opencode/static/js/game.js`
- Modify: `src/opencode/static/js/main.js`
- Modify: `src/opencode/templates/base.html` (the seven `<script src="...">` lines at the end of `<body>`)
- Modify: `src/opencode/static/tests/level3_smoke.html` (script block only)

**Interfaces:**
- Consumes: nothing from earlier tasks (this is the first task).
- Produces: six ES modules whose export names equal today's global names — `Audio`, `Input`, `Levels`, `Entities`, `Renderer`, `Game` — so every downstream consumer imports `{ Audio }`, `{ Input }`, etc.

- [ ] **Step 1: Convert the three leaf modules (no imports needed) — audio.js, input.js, levels.js**

For each file, change the first IIFE binding line from `const X = (() => {` to `export const X = (() => {`:

- `audio.js` line 5: `const Audio = (() => {` → `export const Audio = (() => {`
- `input.js` line 5: `const Input = (() => {` → `export const Input = (() => {`
- `levels.js` line 7: `const Levels = (() => {` → `export const Levels = (() => {`

Nothing else changes in these three files. `export const` + an immediately-invoked arrow function is valid ES module syntax.

- [ ] **Step 2: Convert entities.js — add imports, export the namespace**

Add at the very top of `src/opencode/static/js/entities.js` (before the `const Entities = (() => {` line, after the header comment):

```js
import { Input } from "./input.js";
import { Audio } from "./audio.js";
import { Levels } from "./levels.js";
```

Then change line 6 from `const Entities = (() => {` to `export const Entities = (() => {`.

The existing destructuring inside the IIFE (`const { keys } = Input;` etc.) stays untouched — it now destructures the imported module namespace.

- [ ] **Step 3: Convert renderer.js — add imports, export the namespace**

Add at the very top of `src/opencode/static/js/renderer.js` (before the `const Renderer = (() => {` line):

```js
import { Levels } from "./levels.js";
import { Entities } from "./entities.js";
```

Then change line 5 from `const Renderer = (() => {` to `export const Renderer = (() => {`.

- [ ] **Step 4: Convert game.js — add imports, export the namespace**

Add at the very top of `src/opencode/static/js/game.js` (before the `const Game = (() => {` line):

```js
import { Audio } from "./audio.js";
import { Input } from "./input.js";
import { Levels } from "./levels.js";
import { Entities } from "./entities.js";
import { Renderer } from "./renderer.js";
```

Then change line 5 from `const Game = (() => {` to `export const Game = (() => {`.

- [ ] **Step 5: Rewrite main.js as the bootstrap entry**

Replace the entire contents of `src/opencode/static/js/main.js` with:

```js
// OpenCode — Neon Runner
// Bootstrap entry. The game is split into ES modules; importing game.js
// pulls in the whole graph (audio → input → levels → entities → renderer)
// and kicks off the game loop. No script-order bookkeeping needed anymore.
import { Game } from "./game.js";
```

Note: `Game` is exported by game.js but is not used here — the import exists so the whole module graph evaluates. Do not remove the import; the `export const Game` in game.js makes the symbol available for future tooling (and keeps the smoke test's global-name contract intact).

- [ ] **Step 6: Collapse base.html to a single module script**

In `src/opencode/templates/base.html`, replace the whole script block (currently seven `<script src="...">` lines, lines 18–25) with:

```html
    <script type="module" src="{{ url_for('static', filename='js/main.js') }}"></script>
```

- [ ] **Step 7: Verify the game still boots and plays in the preview**

Start the server if needed (see `.freebuff/run.md`; currently `screen -dmS opencode_preview bash -c 'cd /Users/sajid/Documents/code/code/ollama-code/opencode && PYTHONPATH=src .venv/bin/python .freebuff/launch_server.py > .freebuff/preview.log 2>&1'`). Then:

- `curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/` must print `200`.
- `curl -s --max-time 3 http://127.0.0.1:5000/static/js/main.js` must print `200` and the body must start with `// OpenCode — Neon Runner`.
- In the Preview tab: navigate to `http://127.0.0.1:5000/`, snapshot the page — the "Neon Runner" start screen must render. Click Start; the game must enter level 1 with the HUD updating and no console errors (`preview_logs` empty of errors).
- Confirm the module graph loads without 404s: `curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/static/js/game.js` etc. — all `200`.

Note on ordering: after Step 6 the harness page (classic script tags) is temporarily broken — loading a file containing `export` as a classic script throws a SyntaxError. That's expected mid-task; Step 8 converts the harness to ES modules and Step 9 verifies it, so the tree is green at commit time.

- [ ] **Step 8: Update the smoke-test harness to load modules as ES modules**

In `src/opencode/static/tests/level3_smoke.html`, replace the six `<script src="../js/....js"></script>` tags (audio through game) with one:

```html
<script type="module" src="level3_smoke_runner.js"></script>
```

Then create `src/opencode/static/tests/level3_smoke_runner.js` containing the *entire* inline test script currently in the harness (everything between the existing `<script>` and `</script>` after the module tags) — but with one change at the top of the inline script: replace the first line `"use strict";` with these imports (the rest of the test body stays byte-identical):

```js
import { Audio } from "../js/audio.js";
import { Input } from "../js/input.js";
import { Levels } from "../js/levels.js";
import { Entities } from "../js/entities.js";
import { Renderer } from "../js/renderer.js";
import { Game } from "../js/game.js";
```

The test body's references to `Audio`, `Levels`, `Entities`, `Input`, `Renderer`, and `window.__neon` all keep working — `window.__neon` is still assigned by game.js during module evaluation (it runs on import, exactly as it ran on classic script load).

- [ ] **Step 9: Verify the harness passes**

Reload `http://127.0.0.1:5000/static/tests/level3_smoke.html` in the Preview tab. Every line must print `PASS` (25 checks: 8 level-data incl. jump-reachability BFS, 5 darter, 5 life-heart, 1 music, 6 wiring) and `preview_logs` must show no console errors. The `setTimeout`-based async checks at the end (level-3-intro-after-win) must also print PASS.

- [ ] **Step 10: Commit**

```bash
git add src/opencode/static/js/audio.js src/opencode/static/js/input.js src/opencode/static/js/levels.js src/opencode/static/js/entities.js src/opencode/static/js/renderer.js src/opencode/static/js/game.js src/opencode/static/js/main.js src/opencode/templates/base.html src/opencode/static/tests/level3_smoke.html src/opencode/static/tests/level3_smoke_runner.js
git commit -m "refactor: convert game modules to native ES modules"
```

---

### Task 2: Make `uv run opencode` the one reliable way to run the server

**Files:**
- Modify: `src/opencode/__init__.py` (the `main()` function, currently lines 11–14)
- Modify: `wsgi.py` (currently 7 lines)
- Modify: `.freebuff/start-server.sh` (currently 6 lines)
- Modify: `.freebuff/run.md`
- Delete: `.freebuff/launch_server.py` (superseded — `opencode` console script does the same job now)

**Interfaces:**
- Consumes: Task 1 (unchanged — this task touches only Python/server files).
- Produces: a console command `uv run opencode [--host H] [--port P]` and `python wsgi.py` that both serve via Waitress on 127.0.0.1:5000 by default. `.freebuff/run.md` becomes the single source of truth for running.

- [ ] **Step 1: Write the failing test — prove the current console script is broken**

Run:

```bash
cd /Users/sajid/Documents/code/code/ollama-code/opencode
uv run opencode --port 5055 > /tmp/opencode-broken.log 2>&1 &
sleep 2
curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://127.0.0.1:5055/
kill %1
```

Expected: `000` (connection refused) — because `main()` ignores `--port 5055` and either serves on 5000 or crashes. This confirms the bug this task fixes.

- [ ] **Step 2: Rewrite `main()` in `src/opencode/__init__.py`**

Replace the current `main()` (the 4-line version ending in `app.run()`) with:

```python
def main() -> None:
    """Entry point for the ``opencode`` console script — serves via Waitress.

    Waitress is a production WSGI server and is reliable on macOS, where
    Flask's dev-server reloader crashes after the first request.
    """
    import argparse

    from waitress import serve

    parser = argparse.ArgumentParser(prog="opencode", description="Run the OpenCode dev server.")
    parser.add_argument("--host", default="127.0.0.1", help="bind address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=5000, help="port (default: 5000)")
    args = parser.parse_args()

    app = create_app()
    serve(app, host=args.host, port=args.port)
```

Keep `create_app()` untouched. `waitress` is a hard dependency in `pyproject.toml`, so `from waitress import serve` at module top level of `main()` is safe — but keep it *inside* `main()` so importing `opencode` (e.g., in `wsgi.py`) never requires waitress to be importable at import time.

- [ ] **Step 3: Update `wsgi.py` to use Waitress too**

Replace the entire contents of `wsgi.py` with:

```python
from opencode import create_app

app = create_app()

if __name__ == "__main__":
    from waitress import serve

    serve(app, host="127.0.0.1", port=5000)
```

This keeps `flask --app wsgi run`-style WSGI entrypoints working while making `python wsgi.py` itself reliable on macOS (it now uses Waitress instead of `app.run(debug=True)`).

- [ ] **Step 4: Rewrite `.freebuff/start-server.sh`**

Replace the entire file with:

```bash
#!/bin/bash
# OpenCode dev server — single reliable command. Prefers Waitress (macOS-safe).
# Usage: ./start-server.sh [port]
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${1:-5000}"
exec uv run opencode --host 127.0.0.1 --port "$PORT"
```

- [ ] **Step 5: Delete the obsolete launcher**

```bash
rm .freebuff/launch_server.py
```

(It did exactly what `opencode:main` now does. The `pyproject.toml` console-script entry `opencode = "opencode:main"` already exists — no pyproject change needed.)

- [ ] **Step 6: Rewrite `.freebuff/run.md`**

Replace the whole file with:

````markdown
# Run doc — OpenCode (Neon Runner)

## Reproduce the uncommitted artifacts

None. The project needs no `.env`, secrets, or build artifacts — it's pure
Python + vanilla ES-module JS.

1. Ensure `uv` is installed (`brew install uv`).
2. `cd` to the project root.
3. `uv sync` — installs Flask, Waitress, and dev deps into `.venv/`.

## Run the dev server (one command)

```sh
cd /Users/sajid/Documents/code/code/ollama-code/opencode
uv run opencode --port 5000
```

- Default: `127.0.0.1:5000`.
- Different port if 5000 is busy: `uv run opencode --port 5055`.
- The server uses **Waitress** (production WSGI) — reliable on macOS, where
  Flask's dev-server reloader crashes. `python wsgi.py` is equivalent.

To run detached (survives shell exit), e.g. for a preview:

```sh
cd /Users/sajid/Documents/code/code/ollama-code/opencode
screen -dmS opencode_preview bash -c \
  'cd /Users/sajid/Documents/code/code/ollama-code/opencode && \
   uv run opencode --port 5000 > .freebuff/preview.log 2>&1'
```

Stop with: `screen -S opencode_preview -X quit`

## Smoke tests

Open http://127.0.0.1:5000/static/tests/level3_smoke.html — every line must
print PASS. The harness loads the six modules as ES modules against a stub DOM
and asserts on real behavior (level geometry, darter AI, life hearts, BGM,
win → level-3-intro flow).
````

- [ ] **Step 7: Verify the one-command run path**

```bash
cd /Users/sajid/Documents/code/code/ollama-code/opencode
uv run opencode --port 5055 > /tmp/opencode-new.log 2>&1 &
sleep 2
curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://127.0.0.1:5055/   # expect 200
curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://127.0.0.1:5055/static/tests/level3_smoke.html   # expect 200
kill %1
```

Also verify `python wsgi.py` starts on 5000 and answers `200` (briefly — kill it right after). And run `uv run ruff check .` — must pass clean (0 errors).

- [ ] **Step 8: Commit**

```bash
git add src/opencode/__init__.py wsgi.py .freebuff/start-server.sh .freebuff/run.md
git rm .freebuff/launch_server.py
git commit -m "refactor: serve via waitress from the opencode console script"
```

---

### Task 3: Refresh the docs to match the new architecture

**Files:**
- Modify: `README.md` (game blurb, layout tree, setup, how-the-pieces-fit, reading-the-code)
- Modify: `MODULES.md` (dependency graph, module table, load-order section, smoke-test section, backend section)

**Interfaces:**
- Consumes: Tasks 1–2 (docs describe the new ES-module + one-command world).
- Produces: accurate living documentation; `MODULES.md` stays the auto-generated-style reference.

- [ ] **Step 1: Update README.md game blurb to three levels**

Replace the "**Level 2 — The Voltage Vault**" bullet block (which currently says "Both levels share **3 lives** ...") with a version that lists all three levels and says "**All three levels** share **3 lives**". Keep the existing Level 1 and Level 2 bullets verbatim, then append a new bullet:

```markdown
**Level 3 — Sunflare Ridge** (6,200 px, unlocked after Level 2):

- The longest level: **dashing darters** (telegraph, then charge), flying volts, plasma turrets, and two key/gate pairs
- New pickups: **life hearts** restore an extra life (max 6)
- Brightest palette and fastest BGM track yet
```

- [ ] **Step 2: Update README.md layout tree**

Replace the `src/opencode/static` portion of the layout tree (currently the single `js/main.js` line) with:

```markdown
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

- [ ] **Step 3: Update README.md Setup section**

Replace the current Setup code block with:

```markdown
```sh
uv sync                                # install dependencies into .venv
uv run opencode                        # start server → http://127.0.0.1:5000
uv run opencode --port 5055            # ...or any free port
```

The server uses **Waitress** (production WSGI), which is reliable on macOS
where the Flask dev server crashes. Then open <http://127.0.0.1:5000> and
press **Start**.
```

- [ ] **Step 4: Update README.md "How the pieces fit" and "Reading the code" sections**

- Replace the `**\`static/js/main.js\`** — the entire game: physics, collision, level data, enemies, coins, particles, sound synthesis, input handling, and the render loop. Read \`explanation.md\` for a guided tour.` bullet with:

```markdown
- **`static/js/main.js`** — bootstrap entry: imports `game.js`, which pulls in the full module graph (`audio → input → levels → entities → renderer`) as **native ES modules** — no bundler, no build step, no load-order bookkeeping. `base.html` loads only this one `<script type="module">`.
- **`static/tests/level3_smoke.html`** — browser-based smoke test (loads the modules against a stub DOM and asserts on real behavior). Open it in the running server; every line must print PASS.
```

- Update the "Reading the code" intro so it no longer describes `main.js` as the 1,412-line engine; instead say:

```markdown
Two complementary guides:

- **`MODULES.md`** — the current module architecture: dependency graph, per-module responsibilities and sizes, load order, smoke-test harness, backend layout.
- **`explanation.md` / `explanation.html`** — a plain-text and an interactive visual walkthrough of the *original* monolithic engine (pre-module-split). Useful for understanding the game design; the code now lives across the six ES modules.
```

- [ ] **Step 5: Update MODULES.md — dependency graph and load order**

Replace the ASCII dependency graph with a version reflecting imports:

```markdown
┌─────────────┐         ┌──────────────┐
│   audio.js  │         │   input.js   │
│ (no deps)   │         │ (no deps)    │
└──────┬──────┘         └──────┬───────┘
       │                       │
       ▼                       ▼
┌──────────────────────────────────────────────┐
│              levels.js                        │
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

Replace the "## Load order" section with:

```markdown
## Module loading (ES modules)

`base.html` loads exactly one script:

```html
<script type="module" src=".../js/main.js"></script>
```

`main.js` imports `game.js`, which imports the other five. Dependencies are
**explicit `import` statements** — no script-tag ordering, no global
namespace. Adding a module = create the file + import it where needed;
no HTML edits.
```

- [ ] **Step 6: Update MODULES.md — module table and smoke-test section**

Update the module table to (re-measure with `wc -l src/opencode/static/js/*.js` and fill real numbers; expected roughly: audio 219, input 85, levels 391, entities 476, renderer 550, game 379, main 26 — totals will differ slightly because exports/imports add a few lines):

```markdown
| Module | Lines | Responsibility |
|--------|-------|---------------|
| `audio.js` | (measured) | WebAudio synth — `ensureAudio()`, `tone()`, `sfx`, procedural BGM (3 per-level tracks) |
| `input.js` | (measured) | Keyboard + touch input — `keys`, `bindInput()` |
| `levels.js` | (measured) | Level data (3 levels), themes, constants, seeded PRNG, builder helpers |
| `entities.js` | (measured) | Physics, player, collisions, particles, 14 update systems (incl. darter + life hearts) |
| `renderer.js` | (measured) | All draw functions, canvas setup, HUD |
| `game.js` | (measured) | State machine, game loop, wiring, init, safe respawn, overlay countdowns, BGM control |
| `main.js` | (measured) | Bootstrap entry — imports `game.js` |
| **Total** | **(measured)** | |
```

Update the smoke-test paragraph to say the harness now loads modules as **ES modules** (via `level3_smoke_runner.js`) and mention it must be run through the server (module scripts need http, not file://).

- [ ] **Step 7: Update MODULES.md backend section**

Replace the backend layout block with:

```markdown
## Python backend

```
pyproject.toml        — metadata, deps (flask, waitress), ruff config, console script
wsgi.py               — WSGI entry: `app = create_app()`; `python wsgi.py` serves via Waitress
src/opencode/__init__.py — create_app() factory + main() (argparse → Waitress)
src/opencode/routes.py   — blueprint: GET /
templates/base.html      — layout shell (single <script type="module">)
templates/index.html     – game page markup
```

Backend total: ~50 lines across 5 files. Run it with **one command**:

```sh
uv run opencode --port 5000
```
```

- [ ] **Step 8: Verify docs**

```bash
cd /Users/sajid/Documents/code/code/ollama-code/opencode
grep -n "1,412" README.md MODULES.md   # expect NO matches
grep -n "two levels\|Both levels" README.md   # expect NO matches
grep -n "type=\"module\"" MODULES.md src/opencode/templates/base.html   # expect matches
uv run ruff check .   # still clean
```

Read the final README and MODULES.md end-to-end; confirm every path, command, and count matches the codebase.

- [ ] **Step 9: Commit**

```bash
git add README.md MODULES.md
git commit -m "docs: reflect ES-module architecture and one-command run"
```

---

### Task 4: End-to-end verification and review

**Files:** none (verification only, unless the review finds fixes).

**Interfaces:** consumes all of Tasks 1–3.

- [ ] **Step 1: Fresh-from-scratch run**

```bash
cd /Users/sajid/Documents/code/code/ollama-code/opencode
uv sync
uv run ruff check .
uv run opencode --port 5055 > /tmp/opencode-e2e.log 2>&1 &
sleep 2
curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://127.0.0.1:5055/        # 200
curl -s --max-time 3 -o /dev/null -w "%{http_code}" http://127.0.0.1:5055/static/tests/level3_smoke.html   # 200
kill %1
```

- [ ] **Step 2: Playtest in the preview (start screen → level 1 → win chain → level 2 intro)**

Start the server detached per the updated run.md (`uv run opencode --port 5000` inside screen), register the preview, then:

- Snapshot: start screen renders.
- Click Start: level 1 plays; jump/move via `preview_evaluate` (drive `Input.keys` if needed); confirm HUD score changes and no console errors.
- Drive the win chain via `window.__neon` (as the smoke test does) and confirm the level-complete screen → level 2 intro → level 2 gameplay all advance without button presses, music switches tracks, mute/pause still work.
- Confirm `window.__neon` still works: `window.__neon.playLevel(3)` from the console.

- [ ] **Step 3: Final smoke run**

Reload `http://127.0.0.1:5055/static/tests/level3_smoke.html` — all 25 checks PASS (including the two async ones after the ~3.2s setTimeout), console clean.

- [ ] **Step 4: Review the diff**

Dispatch `code-reviewer-deepseek-flash` to review the whole change set (ES-module conversion, harness runner, `main()`/`wsgi.py`/run.md, README/MODULES). Fix any issues it finds (rerun affected verifications), then commit fixes:

```bash
git add <fixed files>
git commit -m "fix: address review findings"
```

## Self-Review (completed at plan time)

**Spec coverage** — "easier to execute": ES modules remove load-order fragility (Task 1), one-command run removes the multi-path confusion (Task 2), docs stop misleading (Task 3). "Better designed for running": Waitress + `--port` covers macOS crashes and port conflicts; smoke test still proves the game works at every step.

**Placeholder scan** — no TBDs; every code block is complete. The `(measured)` line counts in Task 3 Step 6 are intentionally re-measured at execution time because the plan cannot know exact post-refactor line counts — the instruction to run `wc -l` is explicit.

**Type consistency** — all imports use the exported names `Audio`, `Input`, `Levels`, `Entities`, `Renderer`, `Game`; harness runner imports all six; `main()` signature matches the existing `pyproject.toml` console script `opencode = "opencode:main"`; `run.md` and `start-server.sh` both call `uv run opencode --port`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-05-stack-rearchitecture.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — I execute the tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
