#!/bin/bash
cd /Users/sajid/Documents/code/code/ollama-code/opencode
export PYTHONPATH=src
/Users/sajid/Documents/code/code/ollama-code/opencode/.venv/bin/python -c "
from opencode import create_app
app = create_app()
app.run(port=5000, debug=False, use_reloader=False)
"