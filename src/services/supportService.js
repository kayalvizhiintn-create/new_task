import apiClient from './apiClient';

export const supportService = {
  getAll: async () => {
    const response = await apiClient.get('/support/get-all');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/support/get-by-id/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/support/create', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/support/update`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/support/delete?id=${id}`);
    return response.data;
  }
};
