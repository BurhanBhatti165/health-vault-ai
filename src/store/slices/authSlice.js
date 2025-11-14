import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

// Load user from localStorage on initialization
const storedUser = localStorage.getItem('user');
if (storedUser) {
  initialState.user = JSON.parse(storedUser);
  initialState.isAuthenticated = true;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action: User logs in
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    // Action: User signs up
    signupSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('user', JSON.stringify(action.payload));
      
      // Also store in users list
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      existingUsers.push(action.payload);
      localStorage.setItem('users', JSON.stringify(existingUsers));
    },
    // Action: User logs out
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem('user');
    },
    // Action: Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { loginSuccess, signupSuccess, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
