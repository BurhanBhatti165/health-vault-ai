import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Patient', 'Doctor'],
    required: true
  },
  // Profile image
  profileImage: {
    type: String,
    default: null
  },
  // Biography
  bio: {
    type: String,
    default: ""
  },
  // Doctor-specific fields (only used if role is Doctor)
  specialty: {
    type: String,
    trim: true
  },
  hospital: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
