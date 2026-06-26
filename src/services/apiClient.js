import axios from 'axios';
import { useStore } from '../store/useStore';

// Configure the base URL for your API here
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.23.2.5:5100/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add request interceptor to attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // or from your state management
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      console.error('Unauthorized, please log in again.');
      localStorage.removeItem('token');
      useStore.setState({ isAuthenticated: false, currentUser: null });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
