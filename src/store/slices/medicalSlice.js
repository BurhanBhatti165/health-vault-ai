import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  doctorFolders: [],
  appointments: [],
  documents: [],
  patients: [],
  groupedCards: [], // For doctor/patient cards with appointments
  loading: false,
};

// Load data from localStorage on initialization
const storedFolders = localStorage.getItem('doctorFolders');
const storedAppointments = localStorage.getItem('appointments');
const storedDocuments = localStorage.getItem('documents');

if (storedFolders) {
  initialState.doctorFolders = JSON.parse(storedFolders);
}
if (storedAppointments) {
  initialState.appointments = JSON.parse(storedAppointments);
}
if (storedDocuments) {
  initialState.documents = JSON.parse(storedDocuments);
}

const medicalSlice = createSlice({
  name: 'medical',
  initialState,
  reducers: {
    // Doctor Folders
    createDoctorFolder: (state, action) => {
      state.doctorFolders.unshift(action.payload);
      localStorage.setItem('doctorFolders', JSON.stringify(state.doctorFolders));
    },
    deleteDoctorFolder: (state, action) => {
      state.doctorFolders = state.doctorFolders.filter(folder => folder.id !== action.payload);
      localStorage.setItem('doctorFolders', JSON.stringify(state.doctorFolders));
    },
    updateDoctorFolder: (state, action) => {
      const index = state.doctorFolders.findIndex(folder => folder.id === action.payload.id);
      if (index !== -1) {
        state.doctorFolders[index] = { ...state.doctorFolders[index], ...action.payload };
        localStorage.setItem('doctorFolders', JSON.stringify(state.doctorFolders));
      }
    },
    
    // Appointments
    createAppointment: (state, action) => {
      state.appointments.unshift(action.payload);
      localStorage.setItem('appointments', JSON.stringify(state.appointments));
    },
    deleteAppointment: (state, action) => {
      state.appointments = state.appointments.filter(apt => apt.id !== action.payload);
      localStorage.setItem('appointments', JSON.stringify(state.appointments));
    },
    updateAppointment: (state, action) => {
      const index = state.appointments.findIndex(apt => apt.id === action.payload.id);
      if (index !== -1) {
        state.appointments[index] = { ...state.appointments[index], ...action.payload };
        localStorage.setItem('appointments', JSON.stringify(state.appointments));
      }
    },
    
    // Documents
    createDocument: (state, action) => {
      state.documents.unshift(action.payload);
      localStorage.setItem('documents', JSON.stringify(state.documents));
    },
    deleteDocument: (state, action) => {
      state.documents = state.documents.filter(doc => doc.id !== action.payload);
      localStorage.setItem('documents', JSON.stringify(state.documents));
    },
    updateDocument: (state, action) => {
      const index = state.documents.findIndex(doc => doc.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = { ...state.documents[index], ...action.payload };
        localStorage.setItem('documents', JSON.stringify(state.documents));
      }
    },
    
    // Patients (for doctor view)
    setPatients: (state, action) => {
      state.patients = action.payload;
    },
    
    // Grouped cards (from API)
    setGroupedCards: (state, action) => {
      state.groupedCards = action.payload;
    },
    
    // Bulk operations
    setAllData: (state, action) => {
      const { doctorFolders, appointments, documents } = action.payload;
      if (doctorFolders) {
        state.doctorFolders = doctorFolders;
        localStorage.setItem('doctorFolders', JSON.stringify(doctorFolders));
      }
      if (appointments) {
        state.appointments = appointments;
        localStorage.setItem('appointments', JSON.stringify(appointments));
      }
      if (documents) {
        state.documents = documents;
        localStorage.setItem('documents', JSON.stringify(documents));
      }
    },
    
    clearAllData: (state) => {
      state.doctorFolders = [];
      state.appointments = [];
      state.documents = [];
      state.patients = [];
      localStorage.removeItem('doctorFolders');
      localStorage.removeItem('appointments');
      localStorage.removeItem('documents');
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  createDoctorFolder,
  deleteDoctorFolder,
  updateDoctorFolder,
  createAppointment,
  deleteAppointment,
  updateAppointment,
  createDocument,
  deleteDocument,
  updateDocument,
  setPatients,
  setGroupedCards,
  setAllData,
  clearAllData,
  setLoading,
} = medicalSlice.actions;

export default medicalSlice.reducer;
