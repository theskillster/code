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
