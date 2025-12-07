import axios from './axios';

export const extractionAPI = {
  getMethods: async () => {
    console.log('📡 [API] GET /extract/methods');
    const response = await axios.get('/extract/methods');
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  extractDocument: async (appointmentId, documentId, method = 'gemini') => {
    console.log(`📡 [API] POST /extract/${appointmentId}/${documentId}?method=${method}`);
    const response = await axios.post(`/extract/${appointmentId}/${documentId}?method=${method}`);
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },
};
