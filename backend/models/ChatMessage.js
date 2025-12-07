import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  // User who owns this chat history (each user has their own AI assistant)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Message sender - either user or AI assistant
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  message: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying of user's chat history
chatMessageSchema.index({ userId: 1, createdAt: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
