# Project Overview

Build a Python Web Application Using FastAPI that can be run locally with `uvicorn main:app --reload`

## Core Features

- RESTful API with FastAPI framework
- At least 3–4 different endpoints (GET, POST, PUT, DELETE)
- Request validation using Pydantic models
- Basic error handling and HTTP status codes
- CORS middleware configuration
- API documentation (automatic with FastAPI’s Swagger UI)

## Project Structure

Organized file structure with separate modules for:

- **Main application file:** `main.py`
- **Models/schemas:** `models.py` or `schemas.py`
- **Route handlers:** `routes/`
- **Configuration:** `config.py`

## Technical Requirements

- Use **Python 3.12+**
- Include proper type hints
- Add docstrings for main functions
- Set up **uvicorn** as the ASGI server
- Include a **README.md** with:
  - Setup instructions
  - How to run the application
  - API endpoint documentation
  - Example API calls

Python requirements and virtual environments should be managed via **`uv`** and *not* `pip`.

```bash
uv venv
uv add dependency1 dependency2
uv sync
```

## Business Purpose

The business purpose is to make learning fun by gamifying learning on the Databricks platform. This app will be the springboard for:
1. creating teams and adding members to teams to compete
2. viewing available challenges. Each 'event' will contain a unique combination of A) SQL/data engineering challenges (write queries, optimize pipelines), B) Machine learning challenges (build models, tune hyperparameters), C) Platform administration challenges (configure clusters, manage permissions)
3. getting hints on challenges when the teams get stuck. Point penalty - each hint costs points from the team's score
4. checking the leaderboard
5. checking if the answer is correct after completing an exercise. Automated validation - system checks answers against expected results (e.g., query output matches, model accuracy meets threshold)
6. It is a Real-time competition - teams race against each other simultaneously during a set time window

## Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

### Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
