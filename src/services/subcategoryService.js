import apiClient from './apiClient';

export const subcategoryService = {
  getAllSubcategories: async () => {
    const response = await apiClient.get('/subcategory/get-all-subcategory');
    return response.data;
  },

  getSubcategoryById: async (id) => {
    const response = await apiClient.get(`/subcategory/get-subcategory-by-id/${id}`);
    return response.data;
  },

  createSubcategory: async (subcategoryData) => {
    const response = await apiClient.post('/subcategory/create-subcategory', subcategoryData);
    return response.data;
  },

  updateSubcategory: async (id, subcategoryData) => {
    const response = await apiClient.put(`/subcategory/update-subcategory`, subcategoryData);
    return response.data;
  },

  deleteSubcategory: async (id) => {
    const response = await apiClient.delete(`/subcategory/delete-subcategory?id=${id}`);
    return response.data;
  }
};
