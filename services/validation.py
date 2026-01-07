import re

from challenges import get_challenge_by_id
from models import Challenge


def validate_answer(challenge_id: str, submitted_answer: str) -> tuple[bool, Challenge | None]:
    """
    Validate a submitted answer against the challenge.

    Returns:
        Tuple of (is_correct, challenge) or (False, None) if challenge not found.
    """
    challenge = get_challenge_by_id(challenge_id)
    if not challenge:
        return False, None

    submitted = submitted_answer.strip()
    expected = challenge.expected_answer

    if challenge.validation_type == "exact":
        is_correct = submitted.lower() == expected.lower()
    elif challenge.validation_type == "regex":
        try:
            is_correct = bool(re.fullmatch(expected, submitted, re.IGNORECASE))
        except re.error:
            is_correct = False
    else:
        is_correct = False

    return is_correct, challenge
