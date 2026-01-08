# Challenge Hub Frontend Design

**Date:** 2026-01-08
**Status:** Approved

## Overview

A React single-page application (SPA) for the Challenge Hub gamification platform. Provides competitor-focused interface for teams to join events, solve challenges, and track rankings.

## Tech Stack

- **Framework:** React 18 with Vite
- **UI Library:** Material-UI (MUI)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **State Management:** React Context + hooks
- **Build Tool:** Vite

## Architecture

### Project Structure

```
challenge-hub-ui/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React Context (TeamContext, EventContext)
│   ├── pages/           # Main screen components
│   ├── services/        # API communication layer
│   ├── utils/           # Helper functions
│   └── App.jsx          # Root component with routing
├── public/
└── package.json
```

### Core Screens

The application consists of three primary screens:

1. **Event List** - Browse and join available events
2. **Challenge View** - Active competition interface
3. **Leaderboard** - Rankings and team progress

## Authentication

**Team Code System:**
- Teams receive a code when created via API
- Competitors enter code on first visit
- Code stored in localStorage for persistence
- Code included in API requests to identify team
- Simple team switching via "Change Team" option

## Routing

```
/ (root)
├── /login - Team code entry
├── /events - Event list page (protected)
├── /events/:eventId/challenges - Challenge view (protected)
└── /events/:eventId/leaderboard - Leaderboard (protected)
```

**Protected Routes:**
- Check TeamContext for valid teamCode
- Redirect to /login if not authenticated
- Handle invalid event IDs gracefully

**Navigation:**
- Material-UI AppBar on all authenticated pages
- Logo/title, navigation links (Events, Leaderboard)
- Team badge with name and "Change Team" button

## Screen Designs

### 1. Event List Page

Landing page showing all available events.

**Components:**
- Team Badge (top-right) - Current team info
- Event Cards (grid) - Each displays:
  - Event name and description
  - Start/end time with status indicator
  - Number of challenges
  - "View Event" or "Join Event" button

**Features:**
- Filter by status (upcoming/active/ended)
- Visual highlighting for active events
- Manual refresh button
- Click card to navigate to Challenge View

**API Endpoints:**
- `GET /events` - Fetch all events
- `GET /teams/{team_id}` - Verify team code

### 2. Challenge View Page

Main competition interface with split-screen layout.

**Layout:**

**Header:**
- Event name
- Countdown timer (until end_time)
- Team name
- Current score

**Challenge Sidebar (left, 30%):**
- List of all event challenges
- Shows: title, point value, status, category badge
- Click to select challenge

**Main Panel (right, 70%):**
- Selected challenge title and description
- Answer submission form (text input + button)
- Hints section (collapsed):
  - Available hints with cost
  - "Get Hint" buttons
  - Previously revealed hints
- Submission feedback messages

**Interactions:**
- Submit answer → immediate validation
- Request hint → confirmation dialog → deduct points
- Challenge selection updates panel (no reload)
- Success animation on correct submission

**API Endpoints:**
- `GET /events/{event_id}` - Event details
- `GET /challenges` - Challenge details (filtered)
- `POST /events/{event_id}/submit` - Answer submission
- `GET /events/{event_id}/hints/{challenge_id}` - Retrieve hints
- `GET /events/{event_id}/teams/{team_id}/progress` - Team progress

### 3. Leaderboard Page

Rankings and team performance within an event.

**Components:**
- Event header with name, status, time remaining
- Leaderboard table with columns:
  - Rank (#)
  - Team Name
  - Score
  - Challenges Completed
  - Last Submission Time
- Current team row highlighted
- Medal icons for top 3 teams
- Manual refresh button
- "Back to Challenges" navigation

**Features:**
- Sortable columns (default: score)
- Auto-scroll to current team position
- Show total competing teams
- Compact mobile view (hide timestamp)

**API Endpoints:**
- `GET /events/{event_id}/leaderboard` - Fetch rankings

## State Management

### TeamContext

Provides:
- `teamCode` - Team identifier
- `teamInfo` - Full team object
- `setTeam(code)` - Authenticate and load data
- `clearTeam()` - Logout
- Persists teamCode to localStorage

### EventContext

Provides:
- `events` - All events list
- `selectedEvent` - Current event
- `challenges` - Event challenges
- `progress` - Team progress in event
- `refreshEvents()` - Reload events
- `selectEvent(eventId)` - Navigate to event
- `submitAnswer(challengeId, answer)` - Submit solution
- `getHint(challengeId, level)` - Request hint
- `refreshLeaderboard()` - Update rankings

## API Service Layer

**File:** `src/services/api.js`

- Axios instance with base URL from environment
- Wrapper functions for all endpoints
- Error handling and response transformation
- Automatic team_id parameter inclusion

**Environment Configuration:**
```
VITE_API_BASE_URL=http://localhost:8000
```

## Error Handling

### Error Scenarios

**Network/API Errors:**
- Snackbar notifications for failed requests
- Retry buttons
- User-friendly messages
- Distinguish 4xx vs 5xx errors

**Validation Errors:**
- Invalid team code: "Team not found"
- Wrong answer: Show API validation message
- Event not started: Show start time
- Event ended: View-only mode

**Edge Cases:**
- No events: Empty state message
- No challenges: Placeholder
- Zero progress: Show "0/N completed"
- Offline: Banner notification

### Loading States

- Skeleton loaders for event cards
- Circular progress for submissions
- Linear progress for hint requests
- Disable buttons during API calls

### UX Enhancements

- Success animations for correct answers
- Color-coded countdown timer
- Toast notifications for events
- Confirmation dialogs for point-costing actions

## Responsive Design

### Breakpoints

- **Mobile** (< 600px): Single column, stacked
- **Tablet** (600-1200px): Adapted layouts
- **Desktop** (> 1200px): Full side-by-side

### Mobile Adaptations

**Event List:**
- Full-width stacked cards
- Collapsed descriptions (2 lines + "Read more")

**Challenge View:**
- Sidebar converts to drawer (hamburger menu)
- Challenge list via floating action button
- Full-width main panel
- Sticky timer in header

**Leaderboard:**
- Hide "Last Submission" column
- Reduce table padding
- Horizontal scroll if needed

**Touch Interactions:**
- 44x44px minimum tap targets
- Large buttons and controls

**Performance:**
- Lazy load challenge details
- Virtualize long lists (50+ items)
- Optimize assets for mobile

## Development Setup

### Initial Setup

```bash
# Create project
npm create vite@latest challenge-hub-ui -- --template react
cd challenge-hub-ui

# Install dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install react-router-dom
npm install axios
npm install @mui/icons-material

# Development
npm run dev  # http://localhost:5173
```

### Environment

`.env` file:
```
VITE_API_BASE_URL=http://localhost:8000
```

### Development Workflow

1. Run FastAPI backend: `uv run uvicorn main:app --reload` (port 8000)
2. Run React frontend: `npm run dev` (port 5173)
3. CORS configured in FastAPI for localhost:5173

### Build

```bash
npm run build     # Creates dist/
npm run preview   # Test production build
```

## Deployment

### Frontend Hosting (Recommended)

**Vercel/Netlify:**
- Free tier with CI/CD
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_BASE_URL` environment variable
- Automatic HTTPS and CDN

### Backend Requirements

- Update CORS `ALLOWED_ORIGINS` to include frontend domain
- Host on accessible platform (AWS, GCP, Railway, Fly.io)
- Use production database (not SQLite)
- Configure environment variables

### Deployment Workflow

1. Build frontend: `npm run build`
2. Deploy static files to hosting platform
3. Update `VITE_API_BASE_URL` to production backend
4. Verify CORS settings
5. Test end-to-end

## Future Enhancements

Not included in MVP, but planned for future iterations:

- Real-time updates (polling or WebSockets)
- Admin interface for event management
- Team formation tools
- Challenge browser with filters
- Analytics dashboard
- Mobile app (React Native)
- Spectator mode
- Notifications system

## Design Decisions

**Why React?** Most popular, huge ecosystem, team familiarity

**Why MUI?** Comprehensive components, fast development, polished look

**Why Vite?** Modern, fast, great developer experience

**Why Context vs Redux?** Sufficient for app size, no extra dependencies

**Why manual refresh vs real-time?** Simplifies MVP, no backend changes needed

**Why team codes vs auth?** Removes complexity, faster to build and use
