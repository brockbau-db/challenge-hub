# Challenge Hub v1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a FastAPI gamification platform for Databricks learning competitions with teams, events, challenges, hints, and leaderboards.

**Architecture:** SQLite persistence, static challenges defined in code, local validation (exact match/regex). RESTful API with Pydantic models. No authentication for v1.

**Tech Stack:** Python 3.12+, FastAPI, SQLite (via sqlite3), Pydantic, uvicorn, uv for dependency management.

---

## Task 1: Project Setup

**Files:**
- Create: `pyproject.toml`
- Create: `main.py`
- Create: `config.py`

**Step 1: Initialize uv project**

Run:
```bash
cd .worktrees/v1-implementation
uv init --name challenge-hub
```

**Step 2: Add dependencies**

Run:
```bash
uv add fastapi uvicorn pydantic pydantic-settings
```

**Step 3: Create config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///challenge_hub.db"
    default_max_team_size: int = 4
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"


settings = Settings()
```

**Step 4: Create minimal main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings

app = FastAPI(
    title="Challenge Hub",
    description="Gamification platform for Databricks learning competitions",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
```

**Step 5: Verify app starts**

Run:
```bash
uv run uvicorn main:app --reload
```

Expected: Server starts, http://localhost:8000/health returns `{"status": "healthy"}`

**Step 6: Commit**

```bash
git add .
git commit -m "feat: initialize project with FastAPI and config"
```

---

## Task 2: Database Setup

**Files:**
- Create: `database.py`
- Modify: `main.py`

**Step 1: Create database.py with schema**

```python
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
```

**Step 2: Update main.py to init DB on startup**

Add to main.py after app creation:

```python
from database import init_db

@app.on_event("startup")
def startup_event():
    """Initialize database on startup."""
    init_db()
```

**Step 3: Verify DB initializes**

Run:
```bash
uv run uvicorn main:app --reload
```

Expected: Server starts, `challenge_hub.db` file is created.

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add SQLite database with schema"
```

---

## Task 3: Pydantic Models

**Files:**
- Create: `models.py`

**Step 1: Create models.py with all schemas**

```python
from datetime import datetime
from pydantic import BaseModel, Field


# --- Hints ---

class Hint(BaseModel):
    order: int
    text: str
    cost: int


# --- Challenges ---

class Challenge(BaseModel):
    id: str
    title: str
    description: str
    category: str
    points: int
    validation_type: str  # "exact" or "regex"
    expected_answer: str
    hints: list[Hint] = []


class ChallengeResponse(BaseModel):
    """Challenge without the answer (for public display)."""
    id: str
    title: str
    description: str
    category: str
    points: int
    hint_count: int


# --- Teams ---

class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    members: list[str] = Field(..., min_length=1)
    workspace_id: str = Field(..., min_length=1)


class TeamUpdate(BaseModel):
    members: list[str] | None = None


class TeamResponse(BaseModel):
    id: str
    name: str
    members: list[str]
    workspace_id: str
    created_at: datetime


# --- Events ---

class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    start_time: datetime
    end_time: datetime
    max_team_size: int = Field(default=4, ge=1)
    challenge_ids: list[str] = []


class EventUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    max_team_size: int | None = Field(default=None, ge=1)
    challenge_ids: list[str] | None = None


class EventResponse(BaseModel):
    id: str
    name: str
    description: str
    start_time: datetime
    end_time: datetime
    max_team_size: int
    challenge_ids: list[str]
    status: str  # "upcoming", "active", "ended"


# --- Gameplay ---

class SubmitAnswer(BaseModel):
    team_id: str
    challenge_id: str
    answer: str


class SubmitResponse(BaseModel):
    correct: bool
    points_earned: int
    current_score: int
    message: str


class HintResponse(BaseModel):
    challenge_id: str
    hint_level: int
    text: str
    cost: int


class LeaderboardEntry(BaseModel):
    rank: int
    team_id: str
    team_name: str
    score: int
    challenges_completed: int


class LeaderboardResponse(BaseModel):
    event_id: str
    rankings: list[LeaderboardEntry]
    generated_at: datetime


class TeamProgress(BaseModel):
    team_id: str
    event_id: str
    score: int
    challenges_completed: list[str]
    hints_used: dict[str, list[int]]  # challenge_id -> list of hint levels
```

**Step 2: Commit**

```bash
git add models.py
git commit -m "feat: add Pydantic models for all entities"
```

---

## Task 4: Static Challenges

**Files:**
- Create: `challenges.py`

**Step 1: Create challenges.py with sample challenges**

```python
from models import Challenge, Hint

CHALLENGES: list[Challenge] = [
    Challenge(
        id="sql-001",
        title="Basic SELECT",
        description="Write a query to select all columns from the 'users' table. What is the SQL keyword used?",
        category="sql",
        points=100,
        validation_type="exact",
        expected_answer="SELECT",
        hints=[
            Hint(order=1, text="The keyword is used at the start of every query that retrieves data.", cost=25),
            Hint(order=2, text="It rhymes with 'elect'.", cost=50),
        ],
    ),
    Challenge(
        id="sql-002",
        title="Counting Rows",
        description="How many rows does 'SELECT COUNT(*) FROM orders' return if there are 150 orders?",
        category="sql",
        points=100,
        validation_type="exact",
        expected_answer="150",
        hints=[
            Hint(order=1, text="COUNT(*) returns the total number of rows.", cost=25),
        ],
    ),
    Challenge(
        id="ml-001",
        title="Supervised Learning",
        description="What type of machine learning uses labeled training data?",
        category="ml",
        points=150,
        validation_type="regex",
        expected_answer=r"supervised(\s+learning)?",
        hints=[
            Hint(order=1, text="The opposite of unsupervised.", cost=30),
            Hint(order=2, text="A teacher 'supervises' students...", cost=50),
        ],
    ),
    Challenge(
        id="de-001",
        title="Delta Lake Format",
        description="What file format does Delta Lake use for data storage?",
        category="data-engineering",
        points=150,
        validation_type="exact",
        expected_answer="parquet",
        hints=[
            Hint(order=1, text="It's a columnar format.", cost=30),
            Hint(order=2, text="Named after a type of flooring.", cost=50),
        ],
    ),
    Challenge(
        id="admin-001",
        title="Cluster Autoscaling",
        description="What Databricks feature automatically adjusts cluster size based on workload?",
        category="admin",
        points=100,
        validation_type="regex",
        expected_answer=r"auto\s*scal(e|ing)",
        hints=[
            Hint(order=1, text="It has 'auto' in the name.", cost=25),
        ],
    ),
]


def get_all_challenges() -> list[Challenge]:
    """Return all challenges."""
    return CHALLENGES


def get_challenge_by_id(challenge_id: str) -> Challenge | None:
    """Return a challenge by ID."""
    for challenge in CHALLENGES:
        if challenge.id == challenge_id:
            return challenge
    return None


def get_challenges_by_category(category: str) -> list[Challenge]:
    """Return challenges filtered by category."""
    return [c for c in CHALLENGES if c.category == category]
```

**Step 2: Commit**

```bash
git add challenges.py
git commit -m "feat: add static challenge definitions"
```

---

## Task 5: Teams CRUD Routes

**Files:**
- Create: `routes/__init__.py`
- Create: `routes/teams.py`
- Modify: `main.py`

**Step 1: Create routes directory and __init__.py**

```bash
mkdir -p routes
touch routes/__init__.py
```

**Step 2: Create routes/teams.py**

```python
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from database import get_connection
from models import TeamCreate, TeamUpdate, TeamResponse

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamResponse, status_code=201)
def create_team(team: TeamCreate):
    """Create a new team."""
    team_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)

    with get_connection() as conn:
        cursor = conn.cursor()

        # Check for duplicate name
        cursor.execute("SELECT id FROM teams WHERE name = ?", (team.name,))
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Team name already exists")

        cursor.execute(
            """
            INSERT INTO teams (id, name, members, workspace_id, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (team_id, team.name, json.dumps(team.members), team.workspace_id, created_at.isoformat()),
        )
        conn.commit()

    return TeamResponse(
        id=team_id,
        name=team.name,
        members=team.members,
        workspace_id=team.workspace_id,
        created_at=created_at,
    )


@router.get("", response_model=list[TeamResponse])
def list_teams():
    """List all teams."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM teams ORDER BY created_at DESC")
        rows = cursor.fetchall()

    return [
        TeamResponse(
            id=row["id"],
            name=row["name"],
            members=json.loads(row["members"]),
            workspace_id=row["workspace_id"],
            created_at=datetime.fromisoformat(row["created_at"]),
        )
        for row in rows
    ]


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: str):
    """Get a team by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM teams WHERE id = ?", (team_id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Team not found")

    return TeamResponse(
        id=row["id"],
        name=row["name"],
        members=json.loads(row["members"]),
        workspace_id=row["workspace_id"],
        created_at=datetime.fromisoformat(row["created_at"]),
    )


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(team_id: str, update: TeamUpdate):
    """Update a team."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM teams WHERE id = ?", (team_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Team not found")

        new_members = update.members if update.members is not None else json.loads(row["members"])

        cursor.execute(
            "UPDATE teams SET members = ? WHERE id = ?",
            (json.dumps(new_members), team_id),
        )
        conn.commit()

    return TeamResponse(
        id=row["id"],
        name=row["name"],
        members=new_members,
        workspace_id=row["workspace_id"],
        created_at=datetime.fromisoformat(row["created_at"]),
    )


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: str):
    """Delete a team."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM teams WHERE id = ?", (team_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Team not found")

        cursor.execute("DELETE FROM teams WHERE id = ?", (team_id,))
        conn.commit()
```

**Step 3: Mount router in main.py**

Add to main.py:

```python
from routes import teams

app.include_router(teams.router)
```

**Step 4: Test endpoints manually**

Run server:
```bash
uv run uvicorn main:app --reload
```

Test with curl:
```bash
# Create team
curl -X POST http://localhost:8000/teams \
  -H "Content-Type: application/json" \
  -d '{"name": "Alpha", "members": ["Alice", "Bob"], "workspace_id": "ws-123"}'

# List teams
curl http://localhost:8000/teams
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add teams CRUD endpoints"
```

---

## Task 6: Events CRUD Routes

**Files:**
- Create: `routes/events.py`
- Modify: `main.py`

**Step 1: Create routes/events.py**

```python
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from database import get_connection
from models import EventCreate, EventUpdate, EventResponse

router = APIRouter(prefix="/events", tags=["events"])


def get_event_status(start_time: datetime, end_time: datetime) -> str:
    """Determine event status based on current time."""
    now = datetime.now(timezone.utc)
    if now < start_time:
        return "upcoming"
    elif now > end_time:
        return "ended"
    return "active"


@router.post("", response_model=EventResponse, status_code=201)
def create_event(event: EventCreate):
    """Create a new event."""
    if event.end_time <= event.start_time:
        raise HTTPException(status_code=422, detail="end_time must be after start_time")

    event_id = str(uuid.uuid4())

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO events (id, name, description, start_time, end_time, max_team_size, challenge_ids)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                event.name,
                event.description,
                event.start_time.isoformat(),
                event.end_time.isoformat(),
                event.max_team_size,
                json.dumps(event.challenge_ids),
            ),
        )
        conn.commit()

    return EventResponse(
        id=event_id,
        name=event.name,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        max_team_size=event.max_team_size,
        challenge_ids=event.challenge_ids,
        status=get_event_status(event.start_time, event.end_time),
    )


@router.get("", response_model=list[EventResponse])
def list_events():
    """List all events."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events ORDER BY start_time DESC")
        rows = cursor.fetchall()

    return [
        EventResponse(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            start_time=datetime.fromisoformat(row["start_time"]),
            end_time=datetime.fromisoformat(row["end_time"]),
            max_team_size=row["max_team_size"],
            challenge_ids=json.loads(row["challenge_ids"]),
            status=get_event_status(
                datetime.fromisoformat(row["start_time"]),
                datetime.fromisoformat(row["end_time"]),
            ),
        )
        for row in rows
    ]


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str):
    """Get an event by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Event not found")

    return EventResponse(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        start_time=datetime.fromisoformat(row["start_time"]),
        end_time=datetime.fromisoformat(row["end_time"]),
        max_team_size=row["max_team_size"],
        challenge_ids=json.loads(row["challenge_ids"]),
        status=get_event_status(
            datetime.fromisoformat(row["start_time"]),
            datetime.fromisoformat(row["end_time"]),
        ),
    )


@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: str, update: EventUpdate):
    """Update an event."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Event not found")

        new_name = update.name if update.name is not None else row["name"]
        new_description = update.description if update.description is not None else row["description"]
        new_start_time = update.start_time.isoformat() if update.start_time else row["start_time"]
        new_end_time = update.end_time.isoformat() if update.end_time else row["end_time"]
        new_max_team_size = update.max_team_size if update.max_team_size is not None else row["max_team_size"]
        new_challenge_ids = json.dumps(update.challenge_ids) if update.challenge_ids is not None else row["challenge_ids"]

        cursor.execute(
            """
            UPDATE events
            SET name = ?, description = ?, start_time = ?, end_time = ?, max_team_size = ?, challenge_ids = ?
            WHERE id = ?
            """,
            (new_name, new_description, new_start_time, new_end_time, new_max_team_size, new_challenge_ids, event_id),
        )
        conn.commit()

    start = datetime.fromisoformat(new_start_time)
    end = datetime.fromisoformat(new_end_time)

    return EventResponse(
        id=event_id,
        name=new_name,
        description=new_description,
        start_time=start,
        end_time=end,
        max_team_size=new_max_team_size,
        challenge_ids=json.loads(new_challenge_ids) if isinstance(new_challenge_ids, str) else new_challenge_ids,
        status=get_event_status(start, end),
    )


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: str):
    """Delete an event."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM events WHERE id = ?", (event_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Event not found")

        cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
        conn.commit()
```

**Step 2: Mount router in main.py**

Add to main.py:

```python
from routes import events

app.include_router(events.router)
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add events CRUD endpoints"
```

---

## Task 7: Challenges Routes

**Files:**
- Create: `routes/challenges.py`
- Modify: `main.py`

**Step 1: Create routes/challenges.py**

```python
from fastapi import APIRouter, HTTPException, Query

from challenges import get_all_challenges, get_challenge_by_id, get_challenges_by_category
from models import ChallengeResponse

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("", response_model=list[ChallengeResponse])
def list_challenges(category: str | None = Query(None, description="Filter by category")):
    """List all challenges (without answers)."""
    if category:
        challenges = get_challenges_by_category(category)
    else:
        challenges = get_all_challenges()

    return [
        ChallengeResponse(
            id=c.id,
            title=c.title,
            description=c.description,
            category=c.category,
            points=c.points,
            hint_count=len(c.hints),
        )
        for c in challenges
    ]


@router.get("/{challenge_id}", response_model=ChallengeResponse)
def get_challenge(challenge_id: str):
    """Get a challenge by ID (without answer)."""
    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return ChallengeResponse(
        id=challenge.id,
        title=challenge.title,
        description=challenge.description,
        category=challenge.category,
        points=challenge.points,
        hint_count=len(challenge.hints),
    )
```

**Step 2: Mount router in main.py**

Add to main.py:

```python
from routes import challenges

app.include_router(challenges.router)
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add challenges list endpoints"
```

---

## Task 8: Validation Service

**Files:**
- Create: `services/__init__.py`
- Create: `services/validation.py`

**Step 1: Create services directory**

```bash
mkdir -p services
touch services/__init__.py
```

**Step 2: Create services/validation.py**

```python
import re

from challenges import get_challenge_by_id
from models import Challenge


def validate_answer(challenge_id: str, submitted_answer: str) -> tuple[bool, Challenge | None]:
    """
    Validate a submitted answer against the challenge.

    Returns:
        Tuple of (is_correct, challenge) or (False, None) if challenge not found.
    """
    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        return False, None

    submitted = submitted_answer.strip()
    expected = challenge.expected_answer

    if challenge.validation_type == "exact":
        is_correct = submitted.lower() == expected.lower()
    elif challenge.validation_type == "regex":
        try:
            is_correct = bool(re.fullmatch(expected, submitted, re.IGNORECASE))
        except re.error:
            is_correct = False
    else:
        is_correct = False

    return is_correct, challenge
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add answer validation service"
```

---

## Task 9: Scoring Service

**Files:**
- Create: `services/scoring.py`

**Step 1: Create services/scoring.py**

```python
import json
from database import get_connection
from challenges import get_challenge_by_id


def calculate_team_score(team_id: str, event_id: str) -> int:
    """
    Calculate a team's total score for an event.

    Score = sum(points for correct submissions) - sum(hint costs)
    """
    with get_connection() as conn:
        cursor = conn.cursor()

        # Get points from correct submissions
        cursor.execute(
            """
            SELECT challenge_id FROM submissions
            WHERE team_id = ? AND event_id = ? AND is_correct = 1
            """,
            (team_id, event_id),
        )
        correct_submissions = cursor.fetchall()

        points = 0
        for row in correct_submissions:
            challenge = get_challenge_by_id(row["challenge_id"])
            if challenge:
                points += challenge.points

        # Subtract hint costs
        cursor.execute(
            """
            SELECT SUM(cost) as total_cost FROM hints_used
            WHERE team_id = ? AND event_id = ?
            """,
            (team_id, event_id),
        )
        hint_row = cursor.fetchone()
        hint_costs = hint_row["total_cost"] or 0

    return points - hint_costs


def get_completed_challenges(team_id: str, event_id: str) -> list[str]:
    """Get list of challenge IDs the team has completed."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT DISTINCT challenge_id FROM submissions
            WHERE team_id = ? AND event_id = ? AND is_correct = 1
            """,
            (team_id, event_id),
        )
        rows = cursor.fetchall()

    return [row["challenge_id"] for row in rows]


def get_hints_used(team_id: str, event_id: str) -> dict[str, list[int]]:
    """Get hints used by team: {challenge_id: [hint_levels]}."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT challenge_id, hint_level FROM hints_used
            WHERE team_id = ? AND event_id = ?
            ORDER BY challenge_id, hint_level
            """,
            (team_id, event_id),
        )
        rows = cursor.fetchall()

    hints: dict[str, list[int]] = {}
    for row in rows:
        cid = row["challenge_id"]
        if cid not in hints:
            hints[cid] = []
        hints[cid].append(row["hint_level"])

    return hints
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add scoring service"
```

---

## Task 10: Leaderboard Service

**Files:**
- Create: `services/leaderboard.py`

**Step 1: Create services/leaderboard.py**

```python
import json
from datetime import datetime, timezone

from database import get_connection
from models import LeaderboardEntry, LeaderboardResponse
from services.scoring import calculate_team_score, get_completed_challenges


def get_leaderboard(event_id: str) -> LeaderboardResponse:
    """Generate leaderboard for an event."""
    with get_connection() as conn:
        cursor = conn.cursor()

        # Get all teams that have submissions for this event
        cursor.execute(
            """
            SELECT DISTINCT t.id, t.name, MAX(s.submitted_at) as last_submission
            FROM teams t
            JOIN submissions s ON t.id = s.team_id
            WHERE s.event_id = ? AND s.is_correct = 1
            GROUP BY t.id, t.name
            """,
            (event_id,),
        )
        teams_with_submissions = cursor.fetchall()

    # Calculate scores for each team
    team_scores = []
    for row in teams_with_submissions:
        team_id = row["id"]
        score = calculate_team_score(team_id, event_id)
        completed = get_completed_challenges(team_id, event_id)
        team_scores.append({
            "team_id": team_id,
            "team_name": row["name"],
            "score": score,
            "challenges_completed": len(completed),
            "last_submission": row["last_submission"],
        })

    # Sort by score (descending), then by last_submission (ascending) for tiebreaker
    team_scores.sort(key=lambda x: (-x["score"], x["last_submission"]))

    # Build rankings
    rankings = []
    for i, ts in enumerate(team_scores):
        rankings.append(
            LeaderboardEntry(
                rank=i + 1,
                team_id=ts["team_id"],
                team_name=ts["team_name"],
                score=ts["score"],
                challenges_completed=ts["challenges_completed"],
            )
        )

    return LeaderboardResponse(
        event_id=event_id,
        rankings=rankings,
        generated_at=datetime.now(timezone.utc),
    )
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add leaderboard service"
```

---

## Task 11: Gameplay Routes

**Files:**
- Create: `routes/gameplay.py`
- Modify: `main.py`

**Step 1: Create routes/gameplay.py**

```python
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from database import get_connection
from challenges import get_challenge_by_id
from models import (
    SubmitAnswer,
    SubmitResponse,
    HintResponse,
    LeaderboardResponse,
    TeamProgress,
)
from services.validation import validate_answer
from services.scoring import calculate_team_score, get_completed_challenges, get_hints_used
from services.leaderboard import get_leaderboard

router = APIRouter(prefix="/events/{event_id}", tags=["gameplay"])


def get_event_or_404(event_id: str):
    """Get event or raise 404."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    return row


def check_event_active(event_row):
    """Check if event is active, raise 400 if not."""
    start = datetime.fromisoformat(event_row["start_time"])
    end = datetime.fromisoformat(event_row["end_time"])
    now = datetime.now(timezone.utc)

    # Make start/end timezone-aware if they aren't
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    if now < start:
        raise HTTPException(status_code=400, detail="Event not active: has not started")
    if now > end:
        raise HTTPException(status_code=400, detail="Event not active: has ended")


def check_team_exists(team_id: str):
    """Check if team exists, raise 404 if not."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM teams WHERE id = ?", (team_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Team not found")


def check_challenge_in_event(event_row, challenge_id: str):
    """Check if challenge is part of event, raise 404 if not."""
    challenge_ids = json.loads(event_row["challenge_ids"])
    if challenge_id not in challenge_ids:
        raise HTTPException(status_code=404, detail="Challenge not in this event")


@router.post("/submit", response_model=SubmitResponse)
def submit_answer(event_id: str, submission: SubmitAnswer):
    """Submit an answer for a challenge."""
    event_row = get_event_or_404(event_id)
    check_event_active(event_row)
    check_team_exists(submission.team_id)
    check_challenge_in_event(event_row, submission.challenge_id)

    # Check if already solved
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id FROM submissions
            WHERE team_id = ? AND event_id = ? AND challenge_id = ? AND is_correct = 1
            """,
            (submission.team_id, event_id, submission.challenge_id),
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Challenge already completed")

    # Validate answer
    is_correct, challenge = validate_answer(submission.challenge_id, submission.answer)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Record submission
    submission_id = str(uuid.uuid4())
    submitted_at = datetime.now(timezone.utc)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO submissions (id, team_id, event_id, challenge_id, answer, is_correct, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                submission_id,
                submission.team_id,
                event_id,
                submission.challenge_id,
                submission.answer,
                1 if is_correct else 0,
                submitted_at.isoformat(),
            ),
        )
        conn.commit()

    points_earned = challenge.points if is_correct else 0
    current_score = calculate_team_score(submission.team_id, event_id)

    return SubmitResponse(
        correct=is_correct,
        points_earned=points_earned,
        current_score=current_score,
        message="Correct!" if is_correct else "Incorrect. Try again.",
    )


@router.get("/hints/{challenge_id}", response_model=HintResponse)
def get_hint(
    event_id: str,
    challenge_id: str,
    team_id: str = Query(..., description="Team ID"),
    level: int = Query(..., ge=1, description="Hint level (1, 2, 3...)"),
):
    """Reveal a hint for a challenge."""
    event_row = get_event_or_404(event_id)
    check_event_active(event_row)
    check_team_exists(team_id)
    check_challenge_in_event(event_row, challenge_id)

    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Find the hint
    hint = None
    for h in challenge.hints:
        if h.order == level:
            hint = h
            break

    if not hint:
        raise HTTPException(status_code=404, detail=f"Hint level {level} not available")

    # Check if already revealed
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id FROM hints_used
            WHERE team_id = ? AND event_id = ? AND challenge_id = ? AND hint_level = ?
            """,
            (team_id, event_id, challenge_id, level),
        )
        existing = cursor.fetchone()

        if not existing:
            # Record hint usage
            hint_id = str(uuid.uuid4())
            revealed_at = datetime.now(timezone.utc)
            cursor.execute(
                """
                INSERT INTO hints_used (id, team_id, event_id, challenge_id, hint_level, revealed_at, cost)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (hint_id, team_id, event_id, challenge_id, level, revealed_at.isoformat(), hint.cost),
            )
            conn.commit()

    return HintResponse(
        challenge_id=challenge_id,
        hint_level=level,
        text=hint.text,
        cost=hint.cost if not existing else 0,  # No additional cost if already revealed
    )


@router.get("/leaderboard", response_model=LeaderboardResponse)
def leaderboard(event_id: str):
    """Get the leaderboard for an event."""
    get_event_or_404(event_id)  # Verify event exists
    return get_leaderboard(event_id)


@router.get("/teams/{team_id}/progress", response_model=TeamProgress)
def team_progress(event_id: str, team_id: str):
    """Get a team's progress in an event."""
    get_event_or_404(event_id)
    check_team_exists(team_id)

    return TeamProgress(
        team_id=team_id,
        event_id=event_id,
        score=calculate_team_score(team_id, event_id),
        challenges_completed=get_completed_challenges(team_id, event_id),
        hints_used=get_hints_used(team_id, event_id),
    )
```

**Step 2: Mount router in main.py**

Add to main.py:

```python
from routes import gameplay

app.include_router(gameplay.router)
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add gameplay endpoints (submit, hints, leaderboard, progress)"
```

---

## Task 12: Team Size Validation

**Files:**
- Modify: `routes/teams.py`

**Step 1: Add team size validation to create_team**

Update `routes/teams.py` create_team function to check team size against event max:

```python
from config import settings

# In create_team, after checking duplicate name:
if len(team.members) > settings.default_max_team_size:
    raise HTTPException(
        status_code=422,
        detail=f"Team exceeds max size of {settings.default_max_team_size}",
    )
```

**Step 2: Add validation to update_team**

Update update_team to check new member count:

```python
# In update_team, before updating:
if update.members is not None and len(update.members) > settings.default_max_team_size:
    raise HTTPException(
        status_code=422,
        detail=f"Team exceeds max size of {settings.default_max_team_size}",
    )
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add team size validation"
```

---

## Task 13: Update README

**Files:**
- Modify: `README.md`

**Step 1: Write comprehensive README**

```markdown
# Challenge Hub

A gamification platform for Databricks learning competitions. Teams compete to solve challenges within scheduled time windows, earning points and using hints when stuck.

## Setup

```bash
# Create virtual environment and install dependencies
uv venv
uv sync

# Run the server
uv run uvicorn main:app --reload
```

Server runs at http://localhost:8000

## API Documentation

Interactive docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Teams

```bash
# Create a team
curl -X POST http://localhost:8000/teams \
  -H "Content-Type: application/json" \
  -d '{"name": "Alpha", "members": ["Alice", "Bob"], "workspace_id": "ws-123"}'

# List teams
curl http://localhost:8000/teams

# Get team
curl http://localhost:8000/teams/{team_id}

# Update team
curl -X PUT http://localhost:8000/teams/{team_id} \
  -H "Content-Type: application/json" \
  -d '{"members": ["Alice", "Bob", "Charlie"]}'

# Delete team
curl -X DELETE http://localhost:8000/teams/{team_id}
```

### Events

```bash
# Create an event
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SQL Challenge",
    "description": "Test your SQL skills",
    "start_time": "2025-01-07T09:00:00Z",
    "end_time": "2025-01-07T17:00:00Z",
    "challenge_ids": ["sql-001", "sql-002"]
  }'

# List events
curl http://localhost:8000/events

# Get event
curl http://localhost:8000/events/{event_id}
```

### Challenges

```bash
# List all challenges
curl http://localhost:8000/challenges

# Filter by category
curl http://localhost:8000/challenges?category=sql

# Get challenge details
curl http://localhost:8000/challenges/{challenge_id}
```

### Gameplay

```bash
# Submit an answer
curl -X POST http://localhost:8000/events/{event_id}/submit \
  -H "Content-Type: application/json" \
  -d '{"team_id": "...", "challenge_id": "sql-001", "answer": "SELECT"}'

# Get a hint
curl "http://localhost:8000/events/{event_id}/hints/sql-001?team_id=...&level=1"

# View leaderboard
curl http://localhost:8000/events/{event_id}/leaderboard

# View team progress
curl http://localhost:8000/events/{event_id}/teams/{team_id}/progress
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | sqlite:///challenge_hub.db | Database connection string |
| DEFAULT_MAX_TEAM_SIZE | 4 | Maximum members per team |
| HOST | 0.0.0.0 | Server host |
| PORT | 8000 | Server port |
| ALLOWED_ORIGINS | ["*"] | CORS allowed origins |

## Adding Challenges

Edit `challenges.py` to add new challenges:

```python
Challenge(
    id="unique-id",
    title="Challenge Title",
    description="What the team needs to solve",
    category="sql",  # or "ml", "data-engineering", "admin", etc.
    points=100,
    validation_type="exact",  # or "regex"
    expected_answer="the answer",
    hints=[
        Hint(order=1, text="First hint", cost=25),
        Hint(order=2, text="Bigger hint", cost=50),
    ],
)
```
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with setup and API examples"
```

---

## Task 14: Final Verification

**Step 1: Clean start**

```bash
rm -f challenge_hub.db
uv run uvicorn main:app --reload
```

**Step 2: Run through a complete flow**

```bash
# 1. Create a team
TEAM=$(curl -s -X POST http://localhost:8000/teams \
  -H "Content-Type: application/json" \
  -d '{"name": "TestTeam", "members": ["Alice"], "workspace_id": "ws-1"}')
TEAM_ID=$(echo $TEAM | jq -r '.id')

# 2. Create an event (active now)
EVENT=$(curl -s -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event",
    "start_time": "2020-01-01T00:00:00Z",
    "end_time": "2030-01-01T00:00:00Z",
    "challenge_ids": ["sql-001", "sql-002"]
  }')
EVENT_ID=$(echo $EVENT | jq -r '.id')

# 3. Submit correct answer
curl -X POST "http://localhost:8000/events/$EVENT_ID/submit" \
  -H "Content-Type: application/json" \
  -d "{\"team_id\": \"$TEAM_ID\", \"challenge_id\": \"sql-001\", \"answer\": \"SELECT\"}"

# 4. Check leaderboard
curl "http://localhost:8000/events/$EVENT_ID/leaderboard"

# 5. Get a hint
curl "http://localhost:8000/events/$EVENT_ID/hints/sql-002?team_id=$TEAM_ID&level=1"

# 6. Check team progress
curl "http://localhost:8000/events/$EVENT_ID/teams/$TEAM_ID/progress"
```

**Step 3: Verify everything works**

Expected:
- Team created with UUID
- Event created with "active" status
- Submit returns `{"correct": true, "points_earned": 100, ...}`
- Leaderboard shows team with score 100
- Hint returns text and cost
- Progress shows 1 completed challenge, 1 hint used

**Step 4: Final commit if any fixes needed**

```bash
git add .
git commit -m "fix: any final adjustments"
```

---

## Summary

After completing all tasks, you'll have:

- **main.py**: FastAPI app with CORS and router mounting
- **config.py**: Settings with env var support
- **database.py**: SQLite schema and connection management
- **models.py**: Pydantic models for all entities
- **challenges.py**: Static challenge definitions
- **routes/**: Teams, events, challenges, gameplay endpoints
- **services/**: Validation, scoring, leaderboard logic
- **README.md**: Setup and API documentation

Run with: `uv run uvicorn main:app --reload`
