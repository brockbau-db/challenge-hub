from models import Challenge, Hint

CHALLENGES: list[Challenge] = [
    Challenge(
        id="sql-001",
        title="Basic hash function",
        description="Determine the Warehouse ID of the only Serverless SQL Warehouse in your workspace. Start the Warehouse, if it is not already running, and compute an md5 hash of the Warehouse ID using that SQL warehouse. What is the value of hash returned by the SQL query?",
        category="sql",
        points=100,
        validation_type="exact",
        expected_answer="123",
        hints=[
            Hint(order=1, text="Review the available SQL functions in the documentation at: https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-functions-builtin-alpha", cost=25),
            Hint(order=2, text="Find the Warehouse ID in the 'SQL Warehouses' page in your workspace and compute an md5 hash of the Warehouse ID using the `SELECT md5('<replaceWithYourWarehouseID>');`", cost=50),
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
        title="Vector Search",
        description="Open your workspace home directory and find the notebook called 'Vector Search'. Run the setup in cell 1 to create a vector index sync'd with your data. Once the index is created, how many vectors are in the index?",
        category="ml",
        points=150,
        validation_type="exact",
        expected_answer="123",
        hints=[
            Hint(order=1, text="Check in the Catalog Explorer for the table that the vector index is sync'd from", cost=30),
            Hint(order=2, text="Look at `test_table` in the Catalog Explorer and look at the 'Number of Rows Syncd'", cost=50),
        ],
    ),
    # Challenge(
    #     id="ml-001",
    #     title="Supervised Learning",
    #     description="What type of machine learning uses labeled training data?",
    #     category="ml",
    #     points=150,
    #     validation_type="regex",
    #     expected_answer=r"supervised(\s+learning)?",
    #     hints=[
    #         Hint(order=1, text="The opposite of unsupervised.", cost=30),
    #         Hint(order=2, text="A teacher 'supervises' students...", cost=50),
    #     ],
    # ),
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
