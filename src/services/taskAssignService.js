import apiClient from './apiClient';

export const taskAssignService = {
  getAllAssignments: async () => {
    const response = await apiClient.get('/taskassign/get-all-assignments');
    return response.data;
  },

  getAssignmentById: async (id) => {
    const response = await apiClient.get(`/taskassign/get-assignment-by-id/${id}`);
    return response.data;
  },

  createAssignment: async (assignmentData) => {
    const response = await apiClient.post('/taskassign/create-assignment', assignmentData);
    return response.data;
  },

  updateAssignment: async (id, assignmentData) => {
    const response = await apiClient.put(`/taskassign/update-assignment/${id}`, assignmentData);
    return response.data;
  },

  deleteAssignment: async (id) => {
    const response = await apiClient.delete(`/taskassign/delete-assignment/${id}`);
    return response.data;
  }
};
