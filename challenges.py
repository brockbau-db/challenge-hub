"""Challenge definitions loaded from YAML."""

import yaml
from pathlib import Path

from models import Challenge, Hint


def _load_challenges() -> list[Challenge]:
    """Load challenges from YAML file."""
    yaml_path = Path(__file__).parent / "challenges.yaml"
    with open(yaml_path) as f:
        data = yaml.safe_load(f)

    challenges = []
    for c in data["challenges"]:
        hints = [
            Hint(order=i + 1, text=h["text"], cost=h["cost"])
            for i, h in enumerate(c.get("hints", []))
        ]
        challenge = Challenge(
            id=c["id"],
            title=c["title"],
            description=c["description"].strip(),
            category=c["category"],
            points=c["points"],
            validation_type=c["validation_type"],
            expected_answer=c["expected_answer"],
            hints=hints,
        )
        challenges.append(challenge)

    return challenges


CHALLENGES: list[Challenge] = _load_challenges()


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
