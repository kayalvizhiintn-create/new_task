import apiClient from './apiClient';

export const enumService = {
  getPriorityDropdown: async () => {
    const response = await apiClient.get('/enum/get-priority-dropdown');
    return response.data;
  },

  getPriorityById: async (id) => {
    const response = await apiClient.get(`/enum/priority/${id}`);
    return response.data;
  },

  createPriority: async (data) => {
    const response = await apiClient.post('/enum/priority', data);
    return response.data;
  },

  updatePriority: async (id, data) => {
    const response = await apiClient.put(`/enum/priority/${id}`, data);
    return response.data;
  },

  patchPriority: async (id, data) => {
    const response = await apiClient.patch(`/enum/priority/${id}`, data);
    return response.data;
  },

  deletePriority: async (id) => {
    const response = await apiClient.delete(`/enum/priority/${id}`);
    return response.data;
  },

  getStatusDropdown: async () => {
    const response = await apiClient.get('/enum/get-status-dropdown');
    return response.data;
  }
};
