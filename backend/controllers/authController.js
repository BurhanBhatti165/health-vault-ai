import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cloudinary from '../config/cloudinary.js';

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, specialty, hospital, phone } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    if (!['Patient', 'Doctor'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be Patient or Doctor' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle profile image upload to Cloudinary
    let profileImageUrl = null;
    if (req.file) {
      try {
        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'health-vault/profiles',
          resource_type: 'auto'
        });
        
        profileImageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        // Continue without image if upload fails
      }
    }

    // Create user
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      profileImage: profileImageUrl
    };

    // Add doctor-specific fields if role is Doctor
    if (role === 'Doctor') {
      if (specialty) userData.specialty = specialty;
      if (hospital) userData.hospital = hospital;
      if (phone) userData.phone = phone;
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          specialty: user.specialty,
          hospital: user.hospital,
          phone: user.phone,
          bio: user.bio
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          specialty: user.specialty,
          hospital: user.hospital,
          phone: user.phone,
          bio: user.bio
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          specialty: user.specialty,
          hospital: user.hospital,
          phone: user.phone,
          bio: user.bio
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, specialty, hospital, phone, bio } = req.body;

    // Find user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use' 
        });
      }
      user.email = email;
    }

    // Update basic fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    // Update doctor-specific fields
    if (user.role === 'Doctor') {
      if (specialty !== undefined) user.specialty = specialty;
      if (hospital !== undefined) user.hospital = hospital;
      if (phone !== undefined) user.phone = phone;
    }

    // Handle profile image upload
    if (req.file) {
      try {
        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'health-vault/profiles',
          resource_type: 'auto'
        });
        
        user.profileImage = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload image' 
        });
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          specialty: user.specialty,
          hospital: user.hospital,
          phone: user.phone,
          bio: user.bio
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during profile update' 
    });
  }
};

export { register, login, getMe, updateProfile };
