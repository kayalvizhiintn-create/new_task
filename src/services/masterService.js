import apiClient from './apiClient';

export const masterService = {
  getAllMasters: async (params) => {
    const response = await apiClient.get('/masters', { params });
    return response.data;
  },

  getMasterById: async (id) => {
    const response = await apiClient.get(`/masters/${id}`);
    return response.data;
  },

  createMaster: async (masterData) => {
    const response = await apiClient.post('/masters', masterData);
    return response.data;
  },

  updateMaster: async (id, masterData) => {
    const response = await apiClient.put(`/masters/${id}`, masterData);
    return response.data;
  },

  deleteMaster: async (id) => {
    const response = await apiClient.delete(`/masters/${id}`);
    return response.data;
  }
};
