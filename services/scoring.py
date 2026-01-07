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
