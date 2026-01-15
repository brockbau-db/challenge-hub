import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventIcon from '@mui/icons-material/Event';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useEvent } from '../contexts/EventContext';

const statusColors = {
  active: 'success',
  upcoming: 'info',
  ended: 'default',
};

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EventCard({ event, onSelect }) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: event.status === 'active' ? '2px solid' : '1px solid',
        borderColor: event.status === 'active' ? 'success.main' : 'divider',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h2" sx={{ flexGrow: 1, mr: 1 }}>
            {event.name}
          </Typography>
          <Chip
            label={event.status}
            color={statusColors[event.status]}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
          {event.description || 'No description provided'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <EventIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}
          </Typography>
        </Box>

        <Typography variant="body2">
          <strong>{event.challenge_ids?.length || 0}</strong> challenges
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant={event.status === 'active' ? 'contained' : 'outlined'}
          color={event.status === 'active' ? 'success' : 'primary'}
          fullWidth
          onClick={() => onSelect(event.id)}
          startIcon={event.status === 'active' ? <PlayArrowIcon /> : null}
        >
          {event.status === 'active' ? 'Join Event' : 'View Event'}
        </Button>
      </CardActions>
    </Card>
  );
}

function EventCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="40%" sx={{ mt: 2 }} />
      </CardContent>
      <CardActions sx={{ p: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={36} />
      </CardActions>
    </Card>
  );
}

export default function EventListPage() {
  const navigate = useNavigate();
  const { events, loading, error, refreshEvents } = useEvent();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    refreshEvents();
  }, []);

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  const handleSelectEvent = (eventId) => {
    navigate(`/events/${eventId}/challenges`);
  };

  const filteredEvents = events.filter((event) => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  // Sort: active first, then upcoming, then ended
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const order = { active: 0, upcoming: 1, ended: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Events
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshEvents}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="upcoming">Upcoming</ToggleButton>
          <ToggleButton value="ended">Ended</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && events.length === 0 ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <EventCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : sortedEvents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No events found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filter !== 'all' ? 'Try changing the filter or ' : ''}
            Check back later for upcoming competitions.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {sortedEvents.map((event) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event.id}>
              <EventCard event={event} onSelect={handleSelectEvent} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
