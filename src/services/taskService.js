import apiClient from './apiClient';

export const taskService = {
  getAllTasks: async (params) => {
    const response = await apiClient.get('/task/get-all-task', { params });
    return response.data;
  },

  getTaskById: async (id) => {
    const response = await apiClient.get(`/task/get-task-by-id?id=${id}`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await apiClient.post('/task/create-task', taskData);
    return response.data;
  },

  updateTask: async (id, taskData) => {
    const response = await apiClient.put(`/task/update-task`, taskData);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await apiClient.delete(`/task/delete-task?id=${id}`);
    return response.data;
  },

  updateTaskStatus: async (id, statusData) => {
    // Modify this if the backend has a specific endpoint for status change
    const response = await apiClient.patch(`/task/update-task/${id}`, statusData);
    return response.data;
  },

  reviewTask: async (id, reviewData) => {
    const response = await apiClient.post(`/task/review/${id}`, reviewData);
    return response.data;
  }
};
