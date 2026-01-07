import sqlite3
from contextlib import contextmanager
from pathlib import Path

DATABASE_PATH = Path("challenge_hub.db")


def get_db_path() -> Path:
    return DATABASE_PATH


@contextmanager
def get_connection():
    """Context manager for database connections."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initialize database with schema."""
    with get_connection() as conn:
        cursor = conn.cursor()

        # Teams table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS teams (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                members TEXT NOT NULL,
                workspace_id TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        # Events table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                max_team_size INTEGER NOT NULL,
                challenge_ids TEXT NOT NULL
            )
        """)

        # Submissions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id TEXT PRIMARY KEY,
                team_id TEXT NOT NULL,
                event_id TEXT NOT NULL,
                challenge_id TEXT NOT NULL,
                answer TEXT NOT NULL,
                is_correct INTEGER NOT NULL,
                submitted_at TEXT NOT NULL,
                FOREIGN KEY (team_id) REFERENCES teams(id),
                FOREIGN KEY (event_id) REFERENCES events(id)
            )
        """)

        # Hints used table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hints_used (
                id TEXT PRIMARY KEY,
                team_id TEXT NOT NULL,
                event_id TEXT NOT NULL,
                challenge_id TEXT NOT NULL,
                hint_level INTEGER NOT NULL,
                revealed_at TEXT NOT NULL,
                cost INTEGER NOT NULL,
                UNIQUE(team_id, event_id, challenge_id, hint_level),
                FOREIGN KEY (team_id) REFERENCES teams(id),
                FOREIGN KEY (event_id) REFERENCES events(id)
            )
        """)

        conn.commit()
