import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useEvent } from '../contexts/EventContext';
import { useTeam } from '../contexts/TeamContext';

const medalColors = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

function MedalIcon({ rank }) {
  if (rank > 3) return null;

  return (
    <EmojiEventsIcon
      sx={{
        color: medalColors[rank],
        fontSize: 24,
        filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.3))',
      }}
    />
  );
}

export default function LeaderboardPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { teamId } = useTeam();
  const {
    selectedEvent,
    leaderboard,
    loading,
    error,
    selectEvent,
    refreshLeaderboard,
  } = useEvent();

  useEffect(() => {
    const loadData = async () => {
      if (!selectedEvent || selectedEvent.id !== eventId) {
        await selectEvent(eventId);
      }
      refreshLeaderboard();
    };
    loadData();
  }, [eventId]);

  if (loading && !leaderboard) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const rankings = leaderboard?.rankings || [];
  const currentTeamRank = rankings.find(r => r.team_id === teamId);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/events/${eventId}/challenges`)}
            sx={{ mb: 1 }}
          >
            Back to Challenges
          </Button>
          <Typography variant="h4" component="h1">
            Leaderboard
          </Typography>
          {selectedEvent && (
            <Typography variant="subtitle1" color="text.secondary">
              {selectedEvent.name}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshLeaderboard}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {currentTeamRank && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="subtitle2">Your Position</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4">#{currentTeamRank.rank}</Typography>
            <Box>
              <Typography variant="body1">{currentTeamRank.team_name}</Typography>
              <Typography variant="body2">
                {currentTeamRank.score} points | {currentTeamRank.challenges_completed} challenges
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {rankings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No rankings yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to complete a challenge!
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={80}>Rank</TableCell>
                <TableCell>Team</TableCell>
                <TableCell align="right">Score</TableCell>
                {!isMobile && (
                  <TableCell align="right">Challenges</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {rankings.map((entry) => {
                const isCurrentTeam = entry.team_id === teamId;

                return (
                  <TableRow
                    key={entry.team_id}
                    sx={{
                      bgcolor: isCurrentTeam ? 'action.selected' : 'inherit',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MedalIcon rank={entry.rank} />
                        <Typography
                          variant="body1"
                          fontWeight={entry.rank <= 3 ? 'bold' : 'normal'}
                        >
                          {entry.rank}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {entry.team_name}
                        </Typography>
                        {isCurrentTeam && (
                          <Chip label="You" size="small" color="primary" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body1"
                        fontWeight={entry.rank <= 3 ? 'bold' : 'normal'}
                      >
                        {entry.score}
                      </Typography>
                    </TableCell>
                    {!isMobile && (
                      <TableCell align="right">
                        {entry.challenges_completed}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {rankings.length} team{rankings.length !== 1 ? 's' : ''} competing
          {leaderboard?.generated_at && (
            <> | Last updated: {new Date(leaderboard.generated_at).toLocaleTimeString()}</>
          )}
        </Typography>
      </Box>
    </Container>
  );
}
