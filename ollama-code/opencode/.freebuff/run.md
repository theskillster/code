# Run doc — OpenCode (Neon Runner)

## How to reproduce the uncommitted artifacts

The JS modules in `src/opencode/static/js/` have been split from the original
monolithic `main.js` into 7 separate files. No env files, secrets, or build
artifacts are needed — the project is pure Python + vanilla JS.

1. Ensure `uv` is installed (`brew install uv`).
2. `cd` to the project root.
3. `uv sync` — installs Flask and dev dependencies into `.venv/`.
4. No `.env` or config files needed.

## How to run the dev server

```sh
cd /Users/sajid/Documents/code/code/ollama-code/opencode
screen -dmS opencode_preview bash -c \
  'cd /Users/sajid/Documents/code/code/ollama-code/opencode && \
   PYTHONPATH=src .venv/bin/python .freebuff/launch_server.py \
   > .freebuff/preview.log 2>&1'
```

The server listens on `http://127.0.0.1:5000`. It uses **Waitress** (a production-
ready WSGI server) via `launch_server.py`, which avoids the Flask reloader crash
issues on macOS.

To stop:
```
screen -S opencode_preview -X quit
```

## Default port

- **5000** — Waitress/Flask dev server

## Why this approach

The Flask CLI's debug-mode reloader crashes on the first request on macOS.
Running `flask run --no-debug` crashes after serving one response. Running
directly via `python -c` with `use_reloader=False` also crashes. Waitress is
the only reliable option for a persistent preview. The `screen` session keeps
it alive after the spawning shell exits.