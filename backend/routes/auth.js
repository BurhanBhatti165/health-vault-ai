import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', upload.single('profileImage'), register);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, upload.single('profileImage'), updateProfile);

export default router;
