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
