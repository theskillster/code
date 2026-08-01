# OpenCode

A Python + Flask frontend web app scaffold.

## Stack

- Python 3.12
- [Flask](https://flask.palletsprojects.com/) + Jinja2 templates
- [uv](https://docs.astral.sh/uv/) for dependency management
- [Ruff](https://docs.astral.sh/ruff/) for linting & formatting

## Layout

```
.
├── pyproject.toml        # project metadata, deps, ruff config
├── uv.lock               # locked dependency graph
├── wsgi.py               # entry point: `flask --app wsgi run`
├── .python-version       # pinned Python version
├── .editorconfig
├── .gitignore
└── src/
    └── opencode/
        ├── __init__.py   # create_app() factory
        ├── routes.py     # main Blueprint
        ├── templates/    # Jinja2 templates
        └── static/       # css / js
```

## Setup

Requires `uv` (install via `brew install uv`).

```sh
uv sync                  # install dependencies into .venv
uv run flask --app wsgi run --debug
```

Then open <http://127.0.0.1:5000>.

## Useful commands

```sh
uv add <package>             # add a runtime dependency
uv add --dev <package>       # add a dev dependency
uv run ruff check .          # lint
uv run ruff format .         # format
uv run python -m opencode    # run the CLI entry point (currently a stub)
```
