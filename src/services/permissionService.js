import apiClient from './apiClient';

export const permissionService = {
  getModules: async () => {
    const response = await apiClient.get('/permissions/modules');
    return response.data;
  },

  getFlatPermissions: async () => {
    const response = await apiClient.get('/permissions/flat-permissions');
    return response.data;
  },

  getPrivilegesByRole: async (roleId) => {
    const response = await apiClient.get(`/permissions/by-role/${roleId}`);
    return response.data;
  },

  saveRolePermissions: async (saveData) => {
    const response = await apiClient.post('/permissions/save', saveData);
    return response.data;
  },

  cloneRolePermissions: async (cloneData) => {
    const response = await apiClient.post('/permissions/clone', cloneData);
    return response.data;
  },

  getPermissionLogs: async (params) => {
    const response = await apiClient.get('/permissions/audit-logs', { params });
    return response.data;
  },

  getPermissionTemplates: async () => {
    const response = await apiClient.get('/permissions/templates');
    return response.data;
  },

  applyPermissionTemplate: async (applyData) => {
    const response = await apiClient.post('/permissions/apply-template', applyData);
    return response.data;
  },

  getUserPayload: async (userId) => {
    const response = await apiClient.get(`/permissions/user-payload/${userId}`);
    return response.data;
  }
};
