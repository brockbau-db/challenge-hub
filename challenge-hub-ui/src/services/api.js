import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Teams
export const getTeam = async (teamId) => {
  const response = await api.get(`/teams/${teamId}`);
  return response.data;
};

export const getTeams = async () => {
  const response = await api.get('/teams');
  return response.data;
};

// Events
export const getEvents = async () => {
  const response = await api.get('/events');
  return response.data;
};

export const getEvent = async (eventId) => {
  const response = await api.get(`/events/${eventId}`);
  return response.data;
};

// Challenges
export const getChallenges = async (category = null) => {
  const params = category ? { category } : {};
  const response = await api.get('/challenges', { params });
  return response.data;
};

export const getChallenge = async (challengeId) => {
  const response = await api.get(`/challenges/${challengeId}`);
  return response.data;
};

// Gameplay
export const submitAnswer = async (eventId, teamId, challengeId, answer) => {
  const response = await api.post(`/events/${eventId}/submit`, {
    team_id: teamId,
    challenge_id: challengeId,
    answer,
  });
  return response.data;
};

export const getHint = async (eventId, challengeId, teamId, level) => {
  const response = await api.get(`/events/${eventId}/hints/${challengeId}`, {
    params: { team_id: teamId, level },
  });
  return response.data;
};

export const getLeaderboard = async (eventId) => {
  const response = await api.get(`/events/${eventId}/leaderboard`);
  return response.data;
};

export const getTeamProgress = async (eventId, teamId) => {
  const response = await api.get(`/events/${eventId}/teams/${teamId}/progress`);
  return response.data;
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
