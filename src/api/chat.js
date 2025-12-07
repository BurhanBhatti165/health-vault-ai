import axios from './axios';

export const chatAPI = {
  // Get user's chat history with AI assistant
  getChatMessages: async () => {
    const response = await axios.get('/chat/messages');
    return response.data;
  },

  // Send message to AI assistant
  sendMessage: async (data) => {
    const response = await axios.post('/chat/send', data);
    return response.data;
  }
};
