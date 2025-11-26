import axios from './axios';

export const appointmentAPI = {
  getAppointments: async () => {
    const response = await axios.get('/appointments');
    return response.data;
  },

  getAppointment: async (id) => {
    const response = await axios.get(`/appointments/${id}`);
    return response.data;
  },

  getDoctors: async () => {
    const response = await axios.get('/appointments/doctors');
    return response.data;
  },

  createAppointment: async (formData) => {
    const response = await axios.post('/appointments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateAppointment: async (id, data) => {
    const response = await axios.put(`/appointments/${id}`, data);
    return response.data;
  },

  deleteAppointment: async (id) => {
    const response = await axios.delete(`/appointments/${id}`);
    return response.data;
  },
};
