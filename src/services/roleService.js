import apiClient from './apiClient';

export const roleService = {
  getAllRoles: async () => {
    const response = await apiClient.get('/rolemaster/get-all-role');
    return response.data;
  },

  getRoleById: async (id) => {
    const response = await apiClient.get(`/rolemaster/get-role-by-id/${id}`);
    return response.data;
  },

  createRole: async (roleData) => {
    const response = await apiClient.post('/rolemaster/create-role', roleData);
    return response.data;
  },

  updateRole: async (roleData) => {
    const response = await apiClient.put('/rolemaster/update-role', roleData);
    return response.data;
  },

  deleteRole: async (id) => {
    const response = await apiClient.delete(`/rolemaster/delete-role?id=${id}`);
    return response.data;
  }
};
