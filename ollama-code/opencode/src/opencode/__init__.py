from pathlib import Path

from flask import Flask

from .routes import main_bp


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder=str(Path(__file__).parent / "templates"),
        static_folder=str(Path(__file__).parent / "static"),
    )
    app.register_blueprint(main_bp)
    return app


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
