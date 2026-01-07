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
