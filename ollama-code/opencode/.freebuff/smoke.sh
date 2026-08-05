#!/bin/bash
# OpenCode (Neon Runner) — one-command smoke test.
# Boots the dev server on a free port, verifies the game + harness pages and
# all seven JS modules serve, runs ruff, and — when Node is available — runs
# the full 34-check harness headlessly (level3_smoke_node.mjs).
# Prints a PASS/FAIL verdict and exits 0/1 so CI or any machine can gate on it.
#
# Usage:  ./.freebuff/smoke.sh [port]     (default: a free port)
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${1:-}"
if [ -z "$PORT" ]; then
  # Pick a free port via the project's Python (uv is a hard dependency).
  PORT="$(uv run python - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
)"
fi

LOG="$(mktemp)"
SERVER_PID=""
cleanup() {
  # Kill the uv run wrapper and its server child. The child's cmdline is
  # ".../opencode --host 127.0.0.1 --port N", so match on the unique port.
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  pkill -f -- "--port $PORT" 2>/dev/null || true
  rm -f "$LOG"
}
trap cleanup EXIT INT TERM

echo "==> Booting dev server on 127.0.0.1:$PORT"
uv run opencode --host 127.0.0.1 --port "$PORT" > "$LOG" 2>&1 &
SERVER_PID=$!

# Wait for the server to answer 200 (up to ~15s).
UP=0
for i in $(seq 1 60); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 1 "http://127.0.0.1:$PORT/" 2>/dev/null || echo 000)" = "200" ]; then UP=1; break; fi
  sleep 0.25
done
if [ "$UP" != "1" ]; then
  echo "FAIL: server did not answer 200 on 127.0.0.1:$PORT"
  tail -20 "$LOG"
  exit 1
fi

FAILS=0
note_fail() { echo "FAIL: $1"; FAILS=$((FAILS + 1)); }

echo "==> HTTP checks"
check_url() {
  local path="$1"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://127.0.0.1:$PORT$path")"
  if [ "$code" = "200" ]; then
    echo "  OK   GET $path -> 200"
  else
    note_fail "GET $path -> $code (expected 200)"
  fi
}

check_url "/"
check_url "/static/tests/level3_smoke.html"
for m in audio input levels entities renderer game main; do
  check_url "/static/js/$m.js"
done

echo "==> ruff"
if uv run ruff check . > /dev/null 2>&1; then
  echo "  OK   ruff check clean"
else
  note_fail "ruff check reported errors"
fi

echo "==> harness"
if command -v node > /dev/null 2>&1; then
  echo "  Running level3_smoke_node.mjs (34 checks)…"
  if node src/opencode/static/tests/level3_smoke_node.mjs; then
    echo "  OK   harness: all checks passed"
  else
    note_fail "harness: one or more checks failed"
  fi
else
  echo "  SKIP Node not installed — headless harness skipped."
  echo "       (Open /static/tests/level3_smoke.html in a browser to run it,"
  echo "        or install Node to run it from the CLI.)"
fi

echo ""
if [ "$FAILS" -eq 0 ]; then
  if command -v node > /dev/null 2>&1; then
    echo "SMOKE: PASS"
  else
    echo "SMOKE: PASS (HTTP checks only — headless harness skipped: no Node)"
  fi
  exit 0
else
  echo "SMOKE: FAIL ($FAILS failed)"
  echo "--- server log tail ---"
  tail -20 "$LOG"
  exit 1
fi
