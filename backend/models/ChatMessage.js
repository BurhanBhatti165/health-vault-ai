import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  // User who owns this chat history
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Appointment this chat is associated with
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
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

// Index for efficient querying of appointment's chat history
chatMessageSchema.index({ appointmentId: 1, createdAt: 1 });
chatMessageSchema.index({ userId: 1, appointmentId: 1, createdAt: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
