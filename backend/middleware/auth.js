import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token, access denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

// Middleware to check if user is a patient
const isPatient = (req, res, next) => {
  if (req.userRole !== 'Patient') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Patient role required.' 
    });
  }
  next();
};

// Middleware to check if user is a doctor
const isDoctor = (req, res, next) => {
  if (req.userRole !== 'Doctor') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Doctor role required.' 
    });
  }
  next();
};

export { authMiddleware, isPatient, isDoctor };
