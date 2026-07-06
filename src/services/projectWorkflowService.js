import apiClient from './apiClient';

export const projectWorkflowService = {
  getStages: async (projectId) => {
    const response = await apiClient.get(`/project-workflow/stage/get-stages/${projectId}`);
    return response.data;
  },

  getStageById: async (id) => {
    const response = await apiClient.get(`/project-workflow/stage/get-stage-by-id/${id}`);
    return response.data;
  },

  createStage: async (data) => {
    const response = await apiClient.post('/project-workflow/stage/create-stage', data);
    return response.data;
  },

  updateStage: async (data) => {
    const response = await apiClient.put('/project-workflow/stage/update-stage', data);
    return response.data;
  },

  deleteStage: async (id) => {
    const response = await apiClient.delete(`/project-workflow/stage/delete-stage/${id}`);
    return response.data;
  },

  getTasks: async (stageId) => {
    const response = await apiClient.get(`/project-workflow/task/get-tasks/${stageId}`);
    return response.data;
  },

  getTaskById: async (id) => {
    const response = await apiClient.get(`/project-workflow/task/get-task-by-id/${id}`);
    return response.data;
  },

  createTask: async (data) => {
    const response = await apiClient.post('/project-workflow/task/create-task', data);
    return response.data;
  },

  updateTask: async (data) => {
    const response = await apiClient.put('/project-workflow/task/update-task', data);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await apiClient.delete(`/project-workflow/task/delete-task/${id}`);
    return response.data;
  },

  assignTask: async (projectTaskId, assignedUserId) => {
    const response = await apiClient.post('/project-workflow/task/assign-task', { projectTaskId, assignedUserId });
    return response.data;
  },

  updateTaskStatus: async (projectTaskId, status, remarks = '') => {
    const response = await apiClient.post('/project-workflow/task/update-task-status', { projectTaskId, status, remarks });
    return response.data;
  },

  updateStageStatus: async (projectStageId, status) => {
    const response = await apiClient.post('/project-workflow/stage/update-stage-status', { projectStageId, status });
    return response.data;
  },

  getTimeline: async (projectId) => {
    const response = await apiClient.get(`/project-workflow/timeline/${projectId}`);
    return response.data;
  },

  getProgress: async (projectId) => {
    const response = await apiClient.get(`/project-workflow/progress/${projectId}`);
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await apiClient.get('/project-workflow/dashboard-summary');
    return response.data;
  },

  addComment: async (data) => {
    const response = await apiClient.post('/project-workflow/task/add-comment', data);
    return response.data;
  },

  addAttachment: async (data) => {
    const response = await apiClient.post('/project-workflow/task/add-attachment', data);
    return response.data;
  },

  getComments: async (taskId) => {
    const response = await apiClient.get(`/project-workflow/task/comments/${taskId}`);
    return response.data;
  },

  getAttachments: async (taskId) => {
    const response = await apiClient.get(`/project-workflow/task/attachments/${taskId}`);
    return response.data;
  }
};

export default projectWorkflowService;
