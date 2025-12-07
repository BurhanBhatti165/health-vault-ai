import express from 'express';
import {
  getChatMessages,
  sendMessage
} from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Get user's chat history with AI assistant
router.get('/messages', getChatMessages);

// Send message to AI assistant
router.post('/send', sendMessage);

export default router;
