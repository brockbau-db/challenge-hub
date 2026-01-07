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
