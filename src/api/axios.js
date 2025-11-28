import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔐 [Axios] Request:', config.method.toUpperCase(), config.url);
    console.log('🔐 [Axios] Token present:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ [Axios] Request error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ [Axios] Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ [Axios] Response error:', error.response?.status, error.config?.url);
    console.error('❌ [Axios] Error data:', error.response?.data);
    if (error.response?.status === 401) {
      console.log('⚠️ [Axios] Unauthorized, clearing auth and redirecting...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
