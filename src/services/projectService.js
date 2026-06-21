import apiClient from './apiClient';

export const projectService = {
  getAllProjects: async (params) => {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },

  getProjectById: async (id) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await apiClient.post('/projects', projectData);
    return response.data;
  },

  updateProject: async (id, projectData) => {
    const response = await apiClient.put(`/projects/${id}`, projectData);
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
  },
  
  getProjectWaterfall: async (id) => {
    const response = await apiClient.get(`/projects/${id}/waterfall`);
    return response.data;
  }
};
