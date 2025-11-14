# Redux Implementation Guide for HealthVault AI

## ✅ What is Redux?

**Redux** is a predictable state management library for JavaScript apps. It helps you manage application state in a centralized store that any component can access.

## 🎯 Why Use Redux?

### Without Redux (Before):
```
App
├── Auth (has: email, password)
│   ├── LoginForm
│   └── SignupForm
├── Dashboard (needs: user, doctorFolders)
│   ├── DoctorList (needs: doctorFolders)
│   └── Stats (needs: doctorFolders, appointments)
└── DoctorFolder (needs: user, folders, appointments)
```
❌ State scattered everywhere  
❌ Props passed through many levels  
❌ Hard to debug  
❌ Components tightly coupled  

### With Redux (After):
```
          Redux Store
         /     |     \
      Auth  Dashboard  DoctorFolder
```
✅ Single source of truth  
✅ Easy to debug  
✅ Components independent  
✅ Predictable state flow  

## 📁 Files Created

### 1. Store Configuration
**File:** `src/store/index.js`
```javascript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import medicalReducer from './slices/medicalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,      // Manages user authentication
    medical: medicalReducer // Manages medical data
  }
});
```

### 2. Auth Slice
**File:** `src/store/slices/authSlice.js`

**State:**
```javascript
{
  user: null,              // Current user object
  isAuthenticated: false,  // Login status
  loading: false          // Loading state
}
```

**Actions:**
- `loginSuccess(userData)` - User logs in
- `signupSuccess(userData)` - User signs up
- `logout()` - User logs out
- `setLoading(true/false)` - Toggle loading

**Example:**
```javascript
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    }
  }
});
```

### 3. Medical Slice
**File:** `src/store/slices/medicalSlice.js`

**State:**
```javascript
{
  doctorFolders: [],  // List of doctor folders
  appointments: [],   // List of appointments
  documents: [],      // List of documents
  patients: [],       // List of patients (for doctors)
  loading: false
}
```

**Actions:**
- `createDoctorFolder(folder)` - Add new doctor
- `deleteDoctorFolder(id)` - Remove doctor
- `createAppointment(appointment)` - Add appointment
- `deleteAppointment(id)` - Remove appointment
- `createDocument(doc)` - Add document
- `setAllData({doctorFolders, appointments})` - Bulk update
- `clearAllData()` - Clear everything

## 🔧 How to Use Redux in Components

### Step 1: Import Hooks
```javascript
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from '@/store/slices/authSlice';
```

### Step 2: Get Data from Store (useSelector)
```javascript
const MyComponent = () => {
  // Read data from Redux store
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { doctorFolders } = useSelector((state) => state.medical);
  
  return <div>Welcome, {user?.full_name}</div>;
};
```

### Step 3: Update Store (useDispatch)
```javascript
const MyComponent = () => {
  const dispatch = useDispatch();
  
  const handleLogin = () => {
    const userData = { id: 1, name: "John" };
    dispatch(loginSuccess(userData)); // Triggers action
  };
  
  const handleLogout = () => {
    dispatch(logout()); // Triggers action
  };
  
  return (
    <button onClick={handleLogin}>Login</button>
  );
};
```

## 📊 Data Flow Diagram

```
User Action (Click Login)
        ↓
  Component calls dispatch()
        ↓
  dispatch(loginSuccess(userData))
        ↓
  Redux Store receives action
        ↓
  Reducer updates state
        ↓
  Components re-render with new data
```

## 🔍 Real Examples from Project

### Example 1: Login (Auth.jsx)
```javascript
// BEFORE Redux
const handleLogin = () => {
  const user = { id: 1, email: "test@test.com" };
  localStorage.setItem("user", JSON.stringify(user));
  navigate("/dashboard");
};

// AFTER Redux
const dispatch = useDispatch();
const handleLogin = () => {
  const user = { id: 1, email: "test@test.com" };
  dispatch(loginSuccess(user)); // Updates Redux + localStorage
  navigate("/dashboard");
};
```

### Example 2: Dashboard (Dashboard.jsx)
```javascript
// BEFORE Redux
const [doctorFolders, setDoctorFolders] = useState([]);
const [user, setUser] = useState(null);

useEffect(() => {
  const userData = JSON.parse(localStorage.getItem("user"));
  const folders = JSON.parse(localStorage.getItem("doctorFolders"));
  setUser(userData);
  setDoctorFolders(folders);
}, []);

// AFTER Redux
const { user } = useSelector((state) => state.auth);
const { doctorFolders } = useSelector((state) => state.medical);
// Data automatically loaded from Redux store!
```

### Example 3: Create Doctor Folder (Dashboard.jsx)
```javascript
// BEFORE Redux
const handleCreateFolder = (data) => {
  const newFolder = { id: Date.now(), ...data };
  const updated = [newFolder, ...doctorFolders];
  setDoctorFolders(updated);
  localStorage.setItem("doctorFolders", JSON.stringify(updated));
};

// AFTER Redux
const dispatch = useDispatch();
const handleCreateFolder = (data) => {
  const newFolder = { id: Date.now(), ...data };
  dispatch(createDoctorFolder(newFolder)); // Handles everything!
};
```

## 🎨 Benefits in This Project

### 1. Authentication State
- User info available everywhere
- Single logout updates entire app
- No prop drilling

### 2. Medical Data Management
- All components see same doctor folders
- Create once, use everywhere
- Automatic localStorage sync

### 3. Better Developer Experience
- Redux DevTools for debugging
- Time-travel debugging
- Clear action history

## 🚀 Next Steps

To view Redux in action:
1. Open Redux DevTools in Chrome
2. Login to the app
3. Watch actions being dispatched
4. See state changes in real-time

## 📚 Key Terms

- **Store**: Central place holding all app state
- **Action**: Event describing what happened
- **Reducer**: Function that updates state based on action
- **Dispatch**: Method to send actions to store
- **Selector**: Function to read data from store
- **Slice**: Collection of reducer logic and actions for a feature

## 🔗 Resources

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React Redux Hooks](https://react-redux.js.org/api/hooks)
- [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
