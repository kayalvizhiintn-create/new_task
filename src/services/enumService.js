import apiClient from './apiClient';

export const enumService = {
  getPriorityDropdown: async () => {
    const response = await apiClient.get('/enum/get-priority-dropdown');
    return response.data;
  },

  getStatusDropdown: async () => {
    const response = await apiClient.get('/enum/get-status-dropdown');
    return response.data;
  }
};
