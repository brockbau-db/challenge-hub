from models import Challenge, Hint

CHALLENGES: list[Challenge] = [
    Challenge(
        id="sql-001",
        title="Basic SELECT",
        description="Write a query to select all columns from the 'users' table. What is the SQL keyword used?",
        category="sql",
        points=100,
        validation_type="exact",
        expected_answer="SELECT",
        hints=[
            Hint(order=1, text="The keyword is used at the start of every query that retrieves data.", cost=25),
            Hint(order=2, text="It rhymes with 'elect'.", cost=50),
        ],
    ),
    Challenge(
        id="sql-002",
        title="Counting Rows",
        description="How many rows does 'SELECT COUNT(*) FROM orders' return if there are 150 orders?",
        category="sql",
        points=100,
        validation_type="exact",
        expected_answer="150",
        hints=[
            Hint(order=1, text="COUNT(*) returns the total number of rows.", cost=25),
        ],
    ),
    Challenge(
        id="ml-001",
        title="Supervised Learning",
        description="What type of machine learning uses labeled training data?",
        category="ml",
        points=150,
        validation_type="regex",
        expected_answer=r"supervised(\s+learning)?",
        hints=[
            Hint(order=1, text="The opposite of unsupervised.", cost=30),
            Hint(order=2, text="A teacher 'supervises' students...", cost=50),
        ],
    ),
    Challenge(
        id="de-001",
        title="Delta Lake Format",
        description="What file format does Delta Lake use for data storage?",
        category="data-engineering",
        points=150,
        validation_type="exact",
        expected_answer="parquet",
        hints=[
            Hint(order=1, text="It's a columnar format.", cost=30),
            Hint(order=2, text="Named after a type of flooring.", cost=50),
        ],
    ),
    Challenge(
        id="admin-001",
        title="Cluster Autoscaling",
        description="What Databricks feature automatically adjusts cluster size based on workload?",
        category="admin",
        points=100,
        validation_type="regex",
        expected_answer=r"auto\s*scal(e|ing)",
        hints=[
            Hint(order=1, text="It has 'auto' in the name.", cost=25),
        ],
    ),
]


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
