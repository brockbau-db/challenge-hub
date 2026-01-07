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
