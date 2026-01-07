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
