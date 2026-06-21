import apiClient from './apiClient';

export const taskChangeStatusService = {
  getAllChanges: async () => {
    const response = await apiClient.get('/taskchangestatus/get-all-changes');
    return response.data;
  },

  getChangeById: async (id) => {
    const response = await apiClient.get(`/taskchangestatus/get-change-by-id/${id}`);
    return response.data;
  },

  createChange: async (changeData) => {
    const response = await apiClient.post('/taskchangestatus/create-change', changeData);
    return response.data;
  },

  updateChange: async (changeData) => {
    const response = await apiClient.put('/taskchangestatus/update-change', changeData);
    return response.data;
  },

  deleteChange: async (id) => {
    const response = await apiClient.delete(`/taskchangestatus/delete-change/${id}`);
    return response.data;
  }
};
