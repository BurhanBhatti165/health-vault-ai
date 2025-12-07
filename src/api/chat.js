import axios from './axios';

export const chatAPI = {
  getChatMessages: async (appointmentId) => {
    console.log('📡 [API] GET /chat/messages/' + appointmentId);
    const response = await axios.get(`/chat/messages/${appointmentId}`);
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  sendMessage: async (appointmentId, message) => {
    console.log('📡 [API] POST /chat/send/' + appointmentId, { message });
    const response = await axios.post(`/chat/send/${appointmentId}`, { message });
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },
};
