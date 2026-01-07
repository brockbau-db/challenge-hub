# Challenge Hub - System Design

## Overview

A FastAPI gamification platform for Databricks learning competitions. Teams compete to solve challenges (SQL, ML, data engineering, etc.) within scheduled time windows, earning points and using hints when stuck.

## Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Persistence | SQLite | Simple, no external dependencies, good for local dev |
| Auth | None | Honor system, keeps v1 simple |
| Challenges | Static (in code) | Predictable, version-controlled, no admin UI needed |
| Validation | Local only (exact match, regex) | Defers Databricks integration to v2 |
| Hints | Tiered, progressive cost | Teams choose how much help they need |
| Events | Scheduled with time windows | Creates urgency, clear competition boundaries |
| Teams | Self-registration, size-capped | Open participation with fairness constraints |
| Scoring | Points only | Simple - no time bonuses or first-blood |

## Data Model

### Team
```
Team
├── id: str (UUID)
├── name: str (unique)
├── members: list[str] (member names, max size enforced)
├── workspace_id: str (Databricks workspace ID)
├── created_at: datetime
```

### Event
```
Event
├── id: str (UUID)
├── name: str
├── description: str
├── start_time: datetime
├── end_time: datetime
├── max_team_size: int
├── challenge_ids: list[str] (which challenges are in this event)
```

### Challenge (static, defined in code)
```
Challenge
├── id: str
├── title: str
├── description: str
├── category: str (free-form: "sql", "ml", "admin", "data-engineering", "ai", etc.)
├── points: int
├── validation_type: str ("exact" | "regex")
├── expected_answer: str (or regex pattern)
├── hints: list[Hint]
    └── Hint
        ├── order: int (1, 2, 3...)
        ├── text: str
        └── cost: int (points deducted)
```

### Submission
```
Submission
├── id: str (UUID)
├── team_id: str
├── event_id: str
├── challenge_id: str
├── answer: str
├── is_correct: bool
├── submitted_at: datetime
├── hints_used: list[int] (which hint levels were revealed)
```

## API Endpoints

### Teams
```
POST   /teams                    Create a team (name, members, workspace_id)
GET    /teams                    List all teams
GET    /teams/{team_id}          Get team details
PUT    /teams/{team_id}          Update team (add/remove members)
DELETE /teams/{team_id}          Delete a team
```

### Events
```
POST   /events                   Create an event (name, start/end times, challenge_ids)
GET    /events                   List all events
GET    /events/{event_id}        Get event details (includes status: upcoming/active/ended)
PUT    /events/{event_id}        Update event
DELETE /events/{event_id}        Delete event
```

### Challenges
```
GET    /challenges               List all challenges (optionally filter by category)
GET    /challenges/{challenge_id} Get challenge details (without answer)
```

### Gameplay
```
POST   /events/{event_id}/submit Submit an answer (team_id, challenge_id, answer)
                                 → Returns: correct/incorrect, points earned, current score

GET    /events/{event_id}/hints/{challenge_id}?team_id=X&level=1
                                 Reveal a hint (deducts points, returns hint text)

GET    /events/{event_id}/leaderboard
                                 Team rankings for this event

GET    /events/{event_id}/teams/{team_id}/progress
                                 Team's progress: completed challenges, hints used, score
```

## Project Structure

```
challenge-hub/
├── main.py                 # FastAPI app, CORS config, router mounting
├── config.py               # Settings (DB path, max team size, etc.)
├── database.py             # SQLite connection, table creation
├── models.py               # Pydantic models for request/response validation
├── challenges.py           # Static challenge definitions (list of dicts)
│
├── routes/
│   ├── __init__.py
│   ├── teams.py            # Team CRUD endpoints
│   ├── events.py           # Event CRUD endpoints
│   ├── challenges.py       # Challenge listing endpoints
│   └── gameplay.py         # Submit, hints, leaderboard, progress
│
├── services/
│   ├── __init__.py
│   ├── validation.py       # Answer validation logic (exact, regex)
│   ├── scoring.py          # Score calculation (points - hint costs)
│   └── leaderboard.py      # Leaderboard computation
│
├── challenge_hub.db        # SQLite database (created at runtime)
├── pyproject.toml          # Dependencies (uv managed)
└── README.md               # Setup and API docs
```

## Validation & Scoring Logic

### Answer Validation

When a team submits an answer:

1. Check event is active (current time between start/end)
2. Check team hasn't already solved this challenge
3. Validate answer based on `validation_type`:
   - **exact**: `submitted_answer.strip().lower() == expected_answer.strip().lower()`
   - **regex**: `re.fullmatch(pattern, submitted_answer, re.IGNORECASE)`
4. If correct, record submission with `is_correct=True`
5. If incorrect, record attempt (for analytics) but no points

### Scoring Calculation

Team score for an event:
```
score = sum(challenge.points for correct submissions)
       - sum(hint.cost for all hints revealed)
```

A team can reveal hints even before submitting. Hint costs apply immediately and persist regardless of whether they eventually solve the challenge.

### Leaderboard Response
```json
{
  "event_id": "...",
  "rankings": [
    {"rank": 1, "team_id": "...", "team_name": "Alpha", "score": 450, "challenges_completed": 8},
    {"rank": 2, "team_id": "...", "team_name": "Beta", "score": 380, "challenges_completed": 7}
  ],
  "generated_at": "2025-01-07T14:30:00Z"
}
```

Ties are broken by who reached that score first (earliest last submission timestamp).

## Edge Cases & Error Handling

### Event Timing
- Submit to inactive event (not started or ended) → `400 Bad Request: Event not active`
- Request hints for inactive event → `400 Bad Request: Event not active`
- Leaderboard for ended event → Still works (shows final standings)

### Team Constraints
- Create team exceeding max size → `422 Unprocessable Entity: Team exceeds max size of {n}`
- Create team with duplicate name → `409 Conflict: Team name already exists`
- Submit without valid team_id → `404 Not Found: Team not found`

### Challenge Submissions
- Submit to already-solved challenge → `400 Bad Request: Challenge already completed`
- Submit to challenge not in event → `404 Not Found: Challenge not in this event`
- Request hint level already revealed → Returns cached hint (no additional cost)
- Request hint level that doesn't exist → `404 Not Found: Hint level {n} not available`

### General
- Invalid UUID format → `422 Unprocessable Entity`
- Missing required fields → `422 Unprocessable Entity` (Pydantic handles this)
- Database errors → `500 Internal Server Error` with generic message

All error responses follow a consistent format:
```json
{"detail": "Human-readable error message"}
```

## Configuration

Settings in `config.py` with environment variable overrides:

```python
class Settings:
    # Database
    DATABASE_URL: str = "sqlite:///challenge_hub.db"

    # Team constraints
    DEFAULT_MAX_TEAM_SIZE: int = 4

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS (for frontend integration later)
    ALLOWED_ORIGINS: list[str] = ["*"]
```

Override via environment:
```bash
DATABASE_URL=sqlite:///prod.db uvicorn main:app
DEFAULT_MAX_TEAM_SIZE=6 uvicorn main:app
```

Events can override `max_team_size` individually - the default is just a fallback when creating events.

## v1 Scope

**Included:**
- Full CRUD for teams and events
- Challenge listing (read-only, static source)
- Answer submission with validation
- Hint system with point penalties
- Per-event leaderboards
- Team progress tracking

**Deferred to v2:**
- External Databricks validation (run actual queries)
- Authentication/authorization
- Dynamic challenge management (CRUD for challenges)
