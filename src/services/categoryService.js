import apiClient from './apiClient';

export const categoryService = {
  getAllCategories: async () => {
    const response = await apiClient.get('/category/get-all-category');
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await apiClient.get(`/category/get-category-by-id/${id}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await apiClient.post('/category/create-category', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await apiClient.put(`/category/update-category`, categoryData);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/category/delete-category?id=${id}`);
    return response.data;
  }
};
