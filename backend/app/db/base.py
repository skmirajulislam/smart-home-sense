from sqlalchemy.orm import declarative_base

from backend.app.db.session import engine

Base = declarative_base()


def create_schema() -> None:
    from backend.app.db import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
