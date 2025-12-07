import express from 'express';
import {
  getChatMessages,
  sendMessage
} from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Get chat history for a specific appointment
router.get('/messages/:appointmentId', getChatMessages);

// Send message to AI assistant for specific appointment
router.post('/send/:appointmentId', sendMessage);

export default router;
