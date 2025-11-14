import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import medicalReducer from './slices/medicalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    medical: medicalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
