import sqlite3
import os
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from backend.app.core.config import settings


def create_connection() -> sqlite3.Connection:
    database_path = Path(os.getenv("ROAMLY_DATABASE_PATH", settings.database_path))
    database = sqlite3.connect(database_path, check_same_thread=False)
    database.row_factory = sqlite3.Row
    database.execute("PRAGMA foreign_keys = ON")
    return database


@contextmanager
def connection() -> Iterator[sqlite3.Connection]:
    database = create_connection()
    try:
        yield database
    finally:
        database.close()


@contextmanager
def transaction() -> Iterator[sqlite3.Connection]:
    database = create_connection()
    try:
        database.execute("BEGIN IMMEDIATE")
        yield database
        database.commit()
    except Exception:
        database.rollback()
        raise
    finally:
        database.close()
