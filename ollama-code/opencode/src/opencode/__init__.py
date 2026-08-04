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
    """Entry point for the ``opencode`` console script."""
    app = create_app()
    app.run()
