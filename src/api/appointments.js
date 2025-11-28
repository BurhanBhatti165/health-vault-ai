import axios from './axios';

export const appointmentAPI = {
  getAppointments: async () => {
    console.log('📡 [API] GET /appointments');
    const response = await axios.get('/appointments');
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  getGroupedAppointments: async () => {
    console.log('📡 [API] GET /appointments/grouped');
    const response = await axios.get('/appointments/grouped');
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  getAppointment: async (id) => {
    console.log('📡 [API] GET /appointments/' + id);
    const response = await axios.get(`/appointments/${id}`);
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  getDoctors: async () => {
    console.log('📡 [API] GET /appointments/doctors');
    const response = await axios.get('/appointments/doctors');
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  createAppointment: async (formData) => {
    console.log('📡 [API] POST /appointments');
    const response = await axios.post('/appointments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  updateAppointment: async (id, data) => {
    console.log('📡 [API] PUT /appointments/' + id, data);
    const response = await axios.put(`/appointments/${id}`, data);
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  uploadDocument: async (id, formData) => {
    console.log('📡 [API] POST /appointments/' + id + '/upload');
    const response = await axios.post(`/appointments/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  removeDocument: async (id, documentId) => {
    console.log('📡 [API] DELETE /appointments/' + id + '/document/' + documentId);
    const response = await axios.delete(`/appointments/${id}/document/${documentId}`);
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },

  deleteAppointment: async (id) => {
    console.log('📡 [API] DELETE /appointments/' + id);
    const response = await axios.delete(`/appointments/${id}`);
    console.log('✅ [API] Response:', response.data);
    return response.data;
  },
};
