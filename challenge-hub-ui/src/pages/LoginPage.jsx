import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useTeam } from '../contexts/TeamContext';

export default function LoginPage() {
  const [teamIdInput, setTeamIdInput] = useState('');
  const { loading, error, setTeam } = useTeam();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamIdInput.trim()) return;

    try {
      await setTeam(teamIdInput.trim());
      navigate('/events');
    } catch {
      // Error is handled by TeamContext
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Challenge Hub
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Enter your team ID to join the competition
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Team ID"
            value={teamIdInput}
            onChange={(e) => setTeamIdInput(e.target.value)}
            placeholder="Enter your team UUID"
            variant="outlined"
            autoFocus
            disabled={loading}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={!teamIdInput.trim() || loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Join Competition'}
          </Button>
        </form>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
          Don't have a team ID? Contact your event organizer.
        </Typography>
      </Paper>
    </Container>
  );
}
