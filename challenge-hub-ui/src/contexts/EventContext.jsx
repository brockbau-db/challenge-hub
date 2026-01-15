import { createContext, useContext, useState, useCallback } from 'react';
import {
  getEvents as fetchEvents,
  getEvent as fetchEvent,
  getChallenges as fetchChallenges,
  getTeamProgress as fetchTeamProgress,
  getLeaderboard as fetchLeaderboard,
  submitAnswer as apiSubmitAnswer,
  getHint as apiGetHint,
} from '../services/api';
import { useTeam } from './TeamContext';

const EventContext = createContext(null);

export function EventProvider({ children }) {
  const { teamId } = useTeam();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents();
      setEvents(data);
      return data;
    } catch (err) {
      setError('Failed to load events');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const selectEvent = useCallback(async (eventId) => {
    try {
      setLoading(true);
      setError(null);

      const event = await fetchEvent(eventId);
      setSelectedEvent(event);

      // Fetch challenges for this event
      const allChallenges = await fetchChallenges();
      const eventChallenges = allChallenges.filter(c =>
        event.challenge_ids.includes(c.id)
      );
      setChallenges(eventChallenges);

      // Fetch team progress if authenticated
      if (teamId) {
        try {
          const prog = await fetchTeamProgress(eventId, teamId);
          setProgress(prog);
        } catch {
          setProgress(null);
        }
      }

      return event;
    } catch (err) {
      setError('Failed to load event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const refreshProgress = useCallback(async () => {
    if (!selectedEvent || !teamId) return null;

    try {
      const prog = await fetchTeamProgress(selectedEvent.id, teamId);
      setProgress(prog);
      return prog;
    } catch (err) {
      console.error('Failed to refresh progress:', err);
      return null;
    }
  }, [selectedEvent, teamId]);

  const refreshLeaderboard = useCallback(async () => {
    if (!selectedEvent) return null;

    try {
      const data = await fetchLeaderboard(selectedEvent.id);
      setLeaderboard(data);
      return data;
    } catch (err) {
      setError('Failed to load leaderboard');
      throw err;
    }
  }, [selectedEvent]);

  const submitAnswer = useCallback(async (challengeId, answer) => {
    if (!selectedEvent || !teamId) {
      throw new Error('No event selected or not authenticated');
    }

    const result = await apiSubmitAnswer(selectedEvent.id, teamId, challengeId, answer);

    // Refresh progress after submission
    await refreshProgress();

    return result;
  }, [selectedEvent, teamId, refreshProgress]);

  const requestHint = useCallback(async (challengeId, level) => {
    if (!selectedEvent || !teamId) {
      throw new Error('No event selected or not authenticated');
    }

    const hint = await apiGetHint(selectedEvent.id, challengeId, teamId, level);

    // Refresh progress after getting hint (score may have changed)
    await refreshProgress();

    return hint;
  }, [selectedEvent, teamId, refreshProgress]);

  const clearSelectedEvent = useCallback(() => {
    setSelectedEvent(null);
    setChallenges([]);
    setProgress(null);
    setLeaderboard(null);
  }, []);

  const value = {
    events,
    selectedEvent,
    challenges,
    progress,
    leaderboard,
    loading,
    error,
    refreshEvents,
    selectEvent,
    refreshProgress,
    refreshLeaderboard,
    submitAnswer,
    requestHint,
    clearSelectedEvent,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}

export default EventContext;
