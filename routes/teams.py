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
