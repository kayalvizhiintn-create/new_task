import apiClient from './apiClient';

export const teamService = {
  getAllTeams: async (params) => {
    const response = await apiClient.get('/teams', { params });
    return response.data;
  },

  getTeamById: async (id) => {
    const response = await apiClient.get(`/teams/${id}`);
    return response.data;
  },

  createTeam: async (teamData) => {
    const response = await apiClient.post('/teams', teamData);
    return response.data;
  },

  updateTeam: async (id, teamData) => {
    const response = await apiClient.put(`/teams/${id}`, teamData);
    return response.data;
  },

  deleteTeam: async (id) => {
    const response = await apiClient.delete(`/teams/${id}`);
    return response.data;
  },
  
  addMemberToTeam: async (teamId, memberData) => {
    const response = await apiClient.post(`/teams/${teamId}/members`, memberData);
    return response.data;
  },
  
  removeMemberFromTeam: async (teamId, memberId) => {
    const response = await apiClient.delete(`/teams/${teamId}/members/${memberId}`);
    return response.data;
  }
};
