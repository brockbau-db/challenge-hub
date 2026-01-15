import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Snackbar,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MenuIcon from '@mui/icons-material/Menu';
import TimerIcon from '@mui/icons-material/Timer';
import { useEvent } from '../contexts/EventContext';
import { useTeam } from '../contexts/TeamContext';

const categoryColors = {
  sql: 'primary',
  ml: 'secondary',
  'data-engineering': 'warning',
  admin: 'info',
};

function calculateTimeLeft(endTime) {
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) {
    return 'Event ended';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const isLow = timeLeft.includes('m') && !timeLeft.includes('h') && parseInt(timeLeft) < 10;

  return (
    <Chip
      icon={<TimerIcon />}
      label={timeLeft}
      color={isLow ? 'error' : 'default'}
      variant="outlined"
    />
  );
}

function ChallengeSidebar({ challenges, selectedId, onSelect, progress, onClose }) {
  const completedIds = progress?.challenges_completed || [];

  return (
    <List sx={{ p: 0 }}>
      {challenges.map((challenge) => {
        const isCompleted = completedIds.includes(challenge.id);
        const isSelected = challenge.id === selectedId;

        return (
          <ListItem key={challenge.id} disablePadding>
            <ListItemButton
              selected={isSelected}
              onClick={() => {
                onSelect(challenge.id);
                onClose?.();
              }}
              sx={{
                borderLeft: isSelected ? '4px solid' : '4px solid transparent',
                borderLeftColor: isSelected ? 'primary.main' : 'transparent',
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isCompleted && <CheckCircleIcon color="success" fontSize="small" />}
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        color: isCompleted ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {challenge.title}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={challenge.category}
                      size="small"
                      color={categoryColors[challenge.category] || 'default'}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={`${challenge.points} pts`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export default function ChallengeViewPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { teamInfo } = useTeam();
  const {
    selectedEvent,
    challenges,
    progress,
    loading,
    error,
    selectEvent,
    submitAnswer,
    requestHint,
  } = useEvent();

  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [revealedHints, setRevealedHints] = useState({});
  const [hintDialogOpen, setHintDialogOpen] = useState(false);
  const [pendingHint, setPendingHint] = useState(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (eventId) {
      selectEvent(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    if (challenges.length > 0 && !selectedChallengeId) {
      // Select first incomplete challenge, or first challenge if all complete
      const completedIds = progress?.challenges_completed || [];
      const incomplete = challenges.find(c => !completedIds.includes(c.id));
      setSelectedChallengeId(incomplete?.id || challenges[0].id);
    }
  }, [challenges, progress]);

  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId);
  const isCompleted = progress?.challenges_completed?.includes(selectedChallengeId);
  const hintsUsedForChallenge = progress?.hints_used?.[selectedChallengeId] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !selectedChallengeId) return;

    try {
      setSubmitting(true);
      setSubmitResult(null);
      const result = await submitAnswer(selectedChallengeId, answer.trim());
      setSubmitResult(result);

      if (result.correct) {
        setAnswer('');
        setSnackbar({
          open: true,
          message: `Correct! +${result.points_earned} points`,
          severity: 'success',
        });
      }
    } catch (err) {
      setSubmitResult({ correct: false, message: err.response?.data?.detail || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestHint = (level, cost) => {
    setPendingHint({ level, cost });
    setHintDialogOpen(true);
  };

  const confirmHint = async () => {
    if (!pendingHint || !selectedChallengeId) return;

    try {
      setLoadingHint(true);
      const hint = await requestHint(selectedChallengeId, pendingHint.level);
      setRevealedHints(prev => ({
        ...prev,
        [selectedChallengeId]: {
          ...prev[selectedChallengeId],
          [pendingHint.level]: hint.text,
        },
      }));
      setSnackbar({
        open: true,
        message: hint.cost > 0 ? `Hint revealed (-${hint.cost} points)` : 'Hint revealed (already purchased)',
        severity: 'info',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to get hint',
        severity: 'error',
      });
    } finally {
      setLoadingHint(false);
      setHintDialogOpen(false);
      setPendingHint(null);
    }
  };

  if (loading && !selectedEvent) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!selectedEvent) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Event not found</Alert>
      </Box>
    );
  }

  const sidebarContent = (
    <ChallengeSidebar
      challenges={challenges}
      selectedId={selectedChallengeId}
      onSelect={setSelectedChallengeId}
      progress={progress}
      onClose={() => setDrawerOpen(false)}
    />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6">{selectedEvent.name}</Typography>
          <Chip
            label={selectedEvent.status}
            color={selectedEvent.status === 'active' ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <CountdownTimer endTime={selectedEvent.end_time} />
          <Chip label={teamInfo?.name} variant="outlined" />
          <Chip
            label={`Score: ${progress?.score || 0}`}
            color="primary"
            variant="outlined"
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<LeaderboardIcon />}
            onClick={() => navigate(`/events/${eventId}/leaderboard`)}
          >
            Leaderboard
          </Button>
        </Box>
      </Paper>

      {/* Main content */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Sidebar - Desktop */}
        {!isMobile && (
          <Paper
            sx={{
              width: 300,
              flexShrink: 0,
              overflow: 'auto',
              borderRight: 1,
              borderColor: 'divider',
            }}
          >
            {sidebarContent}
          </Paper>
        )}

        {/* Sidebar - Mobile Drawer */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box sx={{ width: 280 }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              Challenges
            </Typography>
            {sidebarContent}
          </Box>
        </Drawer>

        {/* Main Panel */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
          {selectedChallenge ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h5">{selectedChallenge.title}</Typography>
                  {isCompleted && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Completed"
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={selectedChallenge.category}
                    color={categoryColors[selectedChallenge.category] || 'default'}
                    size="small"
                  />
                  <Chip
                    label={`${selectedChallenge.points} points`}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedChallenge.description}
                </Typography>
              </Box>

              {/* Answer Form */}
              {!isCompleted && selectedEvent.status === 'active' && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <form onSubmit={handleSubmit}>
                    <Typography variant="subtitle1" gutterBottom>
                      Submit Your Answer
                    </Typography>
                    <TextField
                      fullWidth
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter your answer..."
                      variant="outlined"
                      size="small"
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!answer.trim() || submitting}
                    >
                      {submitting ? <CircularProgress size={24} /> : 'Submit'}
                    </Button>
                  </form>

                  {submitResult && (
                    <Alert
                      severity={submitResult.correct ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                    >
                      {submitResult.message}
                    </Alert>
                  )}
                </Paper>
              )}

              {/* Hints Section */}
              {selectedChallenge.hint_count > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LightbulbIcon color="warning" />
                      <Typography>
                        Hints ({hintsUsedForChallenge.length}/{selectedChallenge.hint_count} revealed)
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {[...Array(selectedChallenge.hint_count)].map((_, index) => {
                      const level = index + 1;
                      const isRevealed = hintsUsedForChallenge.includes(level) ||
                        revealedHints[selectedChallengeId]?.[level];
                      const hintText = revealedHints[selectedChallengeId]?.[level];
                      const estimatedCost = (level) * 25; // Rough estimate

                      return (
                        <Box key={level} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="subtitle2">
                              Hint {level}
                            </Typography>
                            {!isRevealed && selectedEvent.status === 'active' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleRequestHint(level, estimatedCost)}
                                disabled={loadingHint}
                              >
                                Reveal (costs points)
                              </Button>
                            )}
                            {isRevealed && !hintText && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => handleRequestHint(level, 0)}
                                disabled={loadingHint}
                              >
                                Show
                              </Button>
                            )}
                          </Box>
                          {hintText && (
                            <Alert severity="info" icon={<LightbulbIcon />}>
                              {hintText}
                            </Alert>
                          )}
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              )}
            </>
          ) : (
            <Typography color="text.secondary">
              Select a challenge from the list
            </Typography>
          )}
        </Box>
      </Box>

      {/* Hint Confirmation Dialog */}
      <Dialog open={hintDialogOpen} onClose={() => setHintDialogOpen(false)}>
        <DialogTitle>Reveal Hint?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Revealing this hint will deduct points from your score.
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHintDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmHint} variant="contained" disabled={loadingHint}>
            {loadingHint ? <CircularProgress size={24} /> : 'Reveal Hint'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
