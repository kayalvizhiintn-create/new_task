import apiClient from './apiClient';

export const projectService = {
  getAllProjects: async (params) => {
    const response = await apiClient.get('/project/get-all-project', { params });
    return response.data;
  },

  getProjectById: async (id) => {
    const response = await apiClient.get(`/project/get-project-by-id?id=${id}`);
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await apiClient.post('/project/create-project', projectData);
    return response.data;
  },

  updateProject: async (id, projectData) => {
    const response = await apiClient.put(`/project/update-project`, projectData);
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await apiClient.delete(`/project/delete-project?id=${id}`);
    return response.data;
  },
  
  getProjectWaterfall: async (id) => {
    const response = await apiClient.get(`/project/${id}/waterfall`);
    return response.data;
  }
};
