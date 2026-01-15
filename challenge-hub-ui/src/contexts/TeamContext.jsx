import { createContext, useContext, useState, useEffect } from 'react';
import { getTeam } from '../services/api';

const TeamContext = createContext(null);

const STORAGE_KEY = 'challenge_hub_team_id';

export function TeamProvider({ children }) {
  const [teamId, setTeamId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || null;
  });
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTeam = async () => {
      if (!teamId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const team = await getTeam(teamId);
        setTeamInfo(team);
      } catch (err) {
        console.error('Failed to load team:', err);
        setError('Team not found');
        localStorage.removeItem(STORAGE_KEY);
        setTeamId(null);
        setTeamInfo(null);
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [teamId]);

  const setTeam = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const team = await getTeam(id);
      localStorage.setItem(STORAGE_KEY, id);
      setTeamId(id);
      setTeamInfo(team);
      return team;
    } catch (err) {
      setError('Team not found');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearTeam = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTeamId(null);
    setTeamInfo(null);
    setError(null);
  };

  const value = {
    teamId,
    teamInfo,
    loading,
    error,
    setTeam,
    clearTeam,
    isAuthenticated: !!teamInfo,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}

export default TeamContext;
