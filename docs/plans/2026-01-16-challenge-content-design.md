# Challenge Content Design - 60 Hands-On Challenges

## Overview

Create 60 hands-on Databricks challenges stored in YAML format. Challenges require participants to work in the Databricks workspace and discover solutions themselves, rather than simple config lookups or copy-paste execution.

## Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Storage format | Single `challenges.yaml` file | Human-readable, easy to edit, grouped by category |
| Category rename | `ml` → `ai_ml` | Better reflects AI/ML scope |
| Answer type | Deterministic only | Answers known in advance, not workspace-specific |
| Question style | Goal-oriented, not method-oriented | Requires discovery and thinking |
| Difficulty | Medium effort | Requires docs lookup and workspace interaction |

## Categories and Distribution

4 categories, 15 challenges each:

### SQL & Analytics (`sql`)
| Topic Area | Count |
|------------|-------|
| Window functions, CTEs, aggregations | 4 |
| System tables and metadata queries | 3 |
| JSON/array manipulation | 3 |
| Query profiling and optimization | 3 |
| Advanced SQL features (MERGE, PIVOT, etc.) | 2 |

### AI & Machine Learning (`ai_ml`)
| Topic Area | Count |
|------------|-------|
| MLflow (experiments, registry, artifacts) | 5 |
| Model Serving and inference | 3 |
| Feature Store | 2 |
| Vector Search and embeddings | 3 |
| AI Functions and Foundation Models | 2 |

### Data Engineering (`data-engineering`)
| Topic Area | Count |
|------------|-------|
| Delta Lake (time travel, VACUUM, clustering) | 6 |
| Schema management and constraints | 3 |
| Unity Catalog and lineage | 3 |
| Streaming and DLT | 3 |

### Platform Administration (`admin`)
| Topic Area | Count |
|------------|-------|
| Cluster policies and instance pools | 3 |
| Security (tokens, secrets, permissions) | 4 |
| Audit and billing system tables | 3 |
| Identity and access management | 3 |
| Workspace configuration | 2 |

## Challenge Format

### YAML Structure

```yaml
version: "1.0"
categories:
  - id: sql
    name: SQL & Analytics
  - id: ai_ml
    name: AI & Machine Learning
  - id: data-engineering
    name: Data Engineering
  - id: admin
    name: Platform Administration

challenges:
  - id: sql-001
    title: "Window Function Ranking"
    description: |
      Using the samples.tpch.orders table, rank orders by total price
      within each order priority. What is the order key of the order
      ranked #1 in the '1-URGENT' priority?
    category: sql
    points: 150
    validation_type: exact
    expected_answer: "12345"
    hints:
      - text: "Use the RANK() window function with PARTITION BY."
        cost: 35
      - text: "PARTITION BY o_orderpriority ORDER BY o_totalprice DESC"
        cost: 75
```

### Question Style Guidelines

**DO** - State the goal:
> "Find the NYC taxi trips data and calculate the total trip distance for all pickups from zip code 10110."

**DON'T** - Give the solution:
> "Execute: SELECT SUM(trip_distance) FROM samples.nyctaxi.trips WHERE pickup_zip = '10110'"

## Points and Hints

### Points Distribution

| Difficulty | Points | Criteria | Per Category |
|------------|--------|----------|--------------|
| Standard | 100 | Single concept, straightforward | 5 |
| Moderate | 150 | Multi-step or docs research | 7 |
| Advanced | 200 | Complex workflow | 3 |

**Per category total:** 2,150 points
**Overall total:** 8,600 points

### Hints Strategy

| Points | Hint 1 Cost | Hint 2 Cost |
|--------|-------------|-------------|
| 100 | 25 (25%) | 50 (50%) |
| 150 | 35 (23%) | 75 (50%) |
| 200 | 50 (25%) | 100 (50%) |

**Hint 1:** Points toward the right area/tool
**Hint 2:** More specific but still requires work

## Implementation Changes

### New File: `challenges.yaml`
All 60 challenges in YAML format.

### Updated: `challenges.py`
```python
import yaml
from pathlib import Path
from models import Challenge, Hint

def _load_challenges() -> list[Challenge]:
    """Load challenges from YAML file."""
    yaml_path = Path(__file__).parent / "challenges.yaml"
    with open(yaml_path) as f:
        data = yaml.safe_load(f)

    return [
        Challenge(
            id=c["id"],
            title=c["title"],
            description=c["description"],
            category=c["category"],
            points=c["points"],
            validation_type=c["validation_type"],
            expected_answer=c["expected_answer"],
            hints=[
                Hint(order=i+1, text=h["text"], cost=h["cost"])
                for i, h in enumerate(c.get("hints", []))
            ],
        )
        for c in data["challenges"]
    ]

CHALLENGES = _load_challenges()

# Existing functions unchanged
def get_all_challenges() -> list[Challenge]:
    return CHALLENGES

def get_challenge_by_id(challenge_id: str) -> Challenge | None:
    for challenge in CHALLENGES:
        if challenge.id == challenge_id:
            return challenge
    return None

def get_challenges_by_category(category: str) -> list[Challenge]:
    return [c for c in CHALLENGES if c.category == category]
```

### Dependency
Add `pyyaml` via `uv add pyyaml`

## Challenge Outline

### SQL & Analytics (sql-001 to sql-015)

| ID | Title | Points |
|----|-------|--------|
| sql-001 | Window Function Ranking | 150 |
| sql-002 | Recursive CTE Sequences | 150 |
| sql-003 | Function Catalog Exploration | 100 |
| sql-004 | Query History Analysis | 150 |
| sql-005 | Parameterized Queries | 100 |
| sql-006 | PIVOT Transformation | 150 |
| sql-007 | JSON Path Extraction | 150 |
| sql-008 | MERGE Operations | 150 |
| sql-009 | Aggregate with FILTER | 100 |
| sql-010 | Query Profile Metrics | 200 |
| sql-011 | Dynamic Table References | 150 |
| sql-012 | Higher-Order Array Functions | 200 |
| sql-013 | Lateral View Explode | 100 |
| sql-014 | Table-Valued Functions | 100 |
| sql-015 | Cross-Catalog Queries | 200 |

### AI & Machine Learning (ai_ml-001 to ai_ml-015)

| ID | Title | Points |
|----|-------|--------|
| ai_ml-001 | MLflow Experiment Creation | 100 |
| ai_ml-002 | Model Registry Transitions | 150 |
| ai_ml-003 | Feature Table Metadata | 150 |
| ai_ml-004 | AutoML Best Model | 200 |
| ai_ml-005 | Model Serving Configuration | 150 |
| ai_ml-006 | Sample Data Aggregation | 100 |
| ai_ml-007 | Vector Search Index | 200 |
| ai_ml-008 | Foundation Model Queries | 150 |
| ai_ml-009 | Embedding Dimensions | 100 |
| ai_ml-010 | Hyperparameter Logging | 100 |
| ai_ml-011 | Model Signature Inspection | 150 |
| ai_ml-012 | Experiment Run Comparison | 150 |
| ai_ml-013 | AI Functions in SQL | 150 |
| ai_ml-014 | Model Artifact Structure | 100 |
| ai_ml-015 | Batch Inference Checksum | 200 |

### Data Engineering (de-001 to de-015)

| ID | Title | Points |
|----|-------|--------|
| de-001 | Delta Table Properties | 100 |
| de-002 | Time Travel Queries | 150 |
| de-003 | VACUUM Analysis | 150 |
| de-004 | Z-Order Optimization | 150 |
| de-005 | Liquid Clustering | 150 |
| de-006 | Change Data Feed | 200 |
| de-007 | Table Cloning | 100 |
| de-008 | Schema Evolution | 150 |
| de-009 | Check Constraints | 100 |
| de-010 | Table History Metrics | 100 |
| de-011 | Streaming Checkpoints | 200 |
| de-012 | Delta Sharing | 200 |
| de-013 | Unity Catalog Lineage | 150 |
| de-014 | External Locations | 150 |
| de-015 | DLT Expectations | 100 |

### Platform Administration (admin-001 to admin-015)

| ID | Title | Points |
|----|-------|--------|
| admin-001 | Cluster Policy Constraints | 150 |
| admin-002 | Instance Pool Configuration | 100 |
| admin-003 | Init Script Setup | 150 |
| admin-004 | Personal Access Tokens | 100 |
| admin-005 | Audit Log Queries | 150 |
| admin-006 | Workspace Permissions | 150 |
| admin-007 | Secret Scopes | 100 |
| admin-008 | Job Cluster Specs | 150 |
| admin-009 | SCIM and Identity | 200 |
| admin-010 | Billing Usage Analysis | 150 |
| admin-011 | Metastore Configuration | 200 |
| admin-012 | IP Access Lists | 100 |
| admin-013 | Service Principals | 150 |
| admin-014 | System Table Queries | 100 |
| admin-015 | Catalog Permissions | 200 |

## Validation Approach

Before finalizing each challenge:
1. Execute the challenge steps in a Databricks workspace
2. Verify the expected answer is correct and consistent
3. Confirm hints provide useful guidance without revealing the answer
4. Test both validation types (exact/regex) work correctly
