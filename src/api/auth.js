import axios from './axios';

export const authAPI = {
  register: async (userData) => {
    // Check if userData is FormData (for image upload)
    const isFormData = userData instanceof FormData;
    
    const response = await axios.post('/auth/register', userData, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data'
      } : undefined
    });
    return response.data;
  },

  login: async (credentials) => {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await axios.get('/auth/me');
    return response.data;
  },

  updateProfile: async (userData) => {
    // Check if userData is FormData (for image upload)
    const isFormData = userData instanceof FormData;
    
    const response = await axios.put('/auth/profile', userData, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data'
      } : undefined
    });
    return response.data;
  },
};
