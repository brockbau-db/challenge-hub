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
