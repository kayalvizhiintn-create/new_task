import apiClient from './apiClient';

export const hardwareOthersService = {
  getAll: async () => {
    const response = await apiClient.get('/hardwareothers/get-all');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/hardwareothers/get-by-id/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/hardwareothers/create', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/hardwareothers/update`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/hardwareothers/delete?id=${id}`);
    return response.data;
  }
};
