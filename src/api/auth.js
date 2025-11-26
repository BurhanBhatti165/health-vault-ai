import axios from './axios';

export const authAPI = {
  register: async (userData) => {
    const response = await axios.post('/auth/register', userData);
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
};
