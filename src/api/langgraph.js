import axios from './axios';

export const langGraphAPI = {
  processDocument: async (appointmentId, documentId) => {
    console.log('📡 [API] POST /langgraph/process/' + appointmentId + '/' + documentId);
    const response = await axios.post(`/langgraph/process/${appointmentId}/${documentId}`);
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  getAnalysis: async (appointmentId) => {
    console.log('📡 [API] GET /langgraph/analysis/' + appointmentId);
    const response = await axios.get(`/langgraph/analysis/${appointmentId}`);
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },
};
