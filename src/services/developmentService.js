import apiClient from './apiClient';

export const developmentService = {
  getAll: async () => {
    const response = await apiClient.get('/development/get-all');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/development/get-by-id/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/development/create', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/development/update`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/development/delete?id=${id}`);
    return response.data;
  }
};
