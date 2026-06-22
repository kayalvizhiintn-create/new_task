import apiClient from './apiClient';

export const privilegeService = {
  getAllPrivileges: async () => {
    const response = await apiClient.get('/privilege/get-all');
    return response.data;
  },

  getPrivilegesByRole: async (roleId) => {
    const response = await apiClient.get(`/privilege/get-by-role/${roleId}`);
    return response.data;
  },

  createPrivilege: async (privilegeData) => {
    const response = await apiClient.post('/privilege/create', privilegeData);
    return response.data;
  },

  deletePrivilege: async (id) => {
    const response = await apiClient.delete(`/privilege/delete?id=${id}`);
    return response.data;
  },

  updatePrivilege: async (privilegeData) => {
    const response = await apiClient.put('/privilege/update', privilegeData);
    return response.data;
  },

  getAllMenus: async () => {
    const response = await apiClient.get('/menu/get-all');
    return response.data;
  },

  getMenuById: async (id) => {
    const response = await apiClient.get(`/menu/get-by-id?id=${id}`);
    return response.data;
  },

  createMenu: async (menuData) => {
    const response = await apiClient.post('/menu/create', menuData);
    return response.data;
  },

  updateMenu: async (menuData) => {
    const response = await apiClient.put('/menu/update', menuData);
    return response.data;
  },

  deleteMenu: async (id) => {
    const response = await apiClient.delete(`/menu/delete?id=${id}`);
    return response.data;
  }
};

