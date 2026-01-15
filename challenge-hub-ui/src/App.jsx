import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import EventListPage from './pages/EventListPage';
import ChallengeViewPage from './pages/ChallengeViewPage';
import LeaderboardPage from './pages/LeaderboardPage';

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar />
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/events" element={<EventListPage />} />
          <Route path="/events/:eventId/challenges" element={<ChallengeViewPage />} />
          <Route path="/events/:eventId/leaderboard" element={<LeaderboardPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="*" element={<Navigate to="/events" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
