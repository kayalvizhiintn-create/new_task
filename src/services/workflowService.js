import apiClient from './apiClient';

export const workflowService = {
  getAllTemplates: async () => {
    const response = await apiClient.get('/workflow/get-all-templates');
    return response.data;
  },

  getTemplateById: async (id) => {
    const response = await apiClient.get(`/workflow/get-template-by-id/${id}`);
    return response.data;
  },

  createTemplate: async (data) => {
    const response = await apiClient.post('/workflow/create-template', data);
    return response.data;
  },

  updateTemplate: async (data) => {
    const response = await apiClient.put('/workflow/update-template', data);
    return response.data;
  },

  deleteTemplate: async (id) => {
    const response = await apiClient.delete(`/workflow/delete-template/${id}`);
    return response.data;
  },

  createStage: async (data) => {
    const response = await apiClient.post('/workflow/create-stage', data);
    return response.data;
  },

  updateStage: async (data) => {
    const response = await apiClient.put('/workflow/update-stage', data);
    return response.data;
  },

  deleteStage: async (id) => {
    const response = await apiClient.delete(`/workflow/delete-stage/${id}`);
    return response.data;
  },

  createTask: async (data) => {
    const response = await apiClient.post('/workflow/create-task', data);
    return response.data;
  },

  updateTask: async (data) => {
    const response = await apiClient.put('/workflow/update-task', data);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await apiClient.delete(`/workflow/delete-task/${id}`);
    return response.data;
  }
};

export default workflowService;
