#!/usr/bin/env python3
"""Launcher for the OpenCode preview server."""
import os
import sys
import time

# Ensure PYTHONPATH includes src/
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
sys.path.insert(0, os.path.join(root, "src"))

from opencode import create_app

app = create_app()
# Use waitress if available, otherwise Flask's dev server without reloader
try:
    from waitress import serve
    serve(app, host="127.0.0.1", port=5000)
except ImportError:
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)