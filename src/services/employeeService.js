import apiClient from './apiClient';

export const employeeService = {
  getAllEmployees: async (params) => {
    const response = await apiClient.get('/emp/get-all-employee', { params });
    return response.data;
  },

  getEmployeeById: async (id) => {
    const response = await apiClient.get(`/emp/get-employee-by-id?id=${id}`);
    return response.data;
  },

  createEmployee: async (employeeData) => {
    const response = await apiClient.post('/emp/create-employee', employeeData);
    return response.data;
  },

  updateEmployee: async (id, employeeData) => {
    const response = await apiClient.put(`/emp/update-employee`, employeeData);
    return response.data;
  },

  deleteEmployee: async (id) => {
    const response = await apiClient.delete(`/emp/delete-employee?id=${id}`);
    return response.data;
  }
};
