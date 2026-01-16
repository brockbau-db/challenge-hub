# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-01-15

### Added
- React frontend application for Challenge Hub UI
- Interactive web interface for viewing events, challenges, and leaderboards
- Real-time team progress tracking in UI
- Frontend build and development workflow with Vite
- Makefile for common development commands

### Changed
- Updated challenge definitions with additional SQL, ML, and admin challenges
- Enhanced documentation with frontend setup instructions

## [0.1.0] - 2026-01-07

### Added
- FastAPI backend application with uvicorn ASGI server
- SQLite database with complete schema for teams, events, challenges, and gameplay
- Pydantic models for all entities with validation constraints
- Teams CRUD endpoints (create, read, update, delete)
- Events CRUD endpoints with time-based competition windows
- Challenges list endpoints with category filtering
- Answer validation service supporting exact match and regex patterns
- Scoring service with point calculations and hint penalties
- Leaderboard service for ranking teams by score
- Gameplay endpoints:
  - Submit answers to challenges
  - Request hints with point costs
  - View leaderboard standings
  - Track team progress within events
- Team size validation to enforce competition rules
- Static challenge definitions for SQL, ML, data engineering, and admin categories
- Comprehensive API documentation via Swagger UI and ReDoc
- Environment-based configuration system
- CORS middleware for cross-origin requests
- Project documentation:
  - System design document
  - V1 implementation plan
  - README with setup instructions and API examples
- Beads (bd) issue tracking integration
- Git worktrees configuration

## [0.0.0] - 2025-12-XX

### Added
- Initial project repository
- Basic project structure
- Git configuration and .gitignore

[Unreleased]: https://github.com/brockbau-db/challenge-hub/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/brockbau-db/challenge-hub/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/brockbau-db/challenge-hub/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/brockbau-db/challenge-hub/releases/tag/v0.0.0
