#!/bin/bash
# OpenCode dev server — single reliable command. Prefers Waitress (macOS-safe).
# Usage: ./start-server.sh [port]
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${1:-5000}"
exec uv run opencode --host 127.0.0.1 --port "$PORT"
