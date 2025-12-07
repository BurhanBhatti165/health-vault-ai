import ChatMessage from '../models/ChatMessage.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { generateAIResponse } from '../config/gemini.js';

// @route   GET /api/chat/messages
// @desc    Get user's chat history with AI assistant
// @access  Private
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await ChatMessage.find({ userId })
      .sort({ createdAt: 1 })
      .limit(100); // Last 100 messages

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat messages'
    });
  }
};

// @route   POST /api/chat/send
// @desc    Send message to AI assistant and get response
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Save user message
    const userMessage = new ChatMessage({
      userId,
      sender: 'user',
      message: message.trim()
    });
    await userMessage.save();

    // Get user's appointments for AI context
    const userRole = req.userRole;
    let appointments = [];

    if (userRole === 'Patient') {
      appointments = await Appointment.find({ patientId: userId })
        .populate('doctorId', 'name specialty hospital')
        .sort({ appointmentDate: -1 })
        .limit(20); // Last 20 appointments
    } else if (userRole === 'Doctor') {
      appointments = await Appointment.find({ doctorId: userId })
        .populate('patientId', 'name email age gender')
        .sort({ appointmentDate: -1 })
        .limit(20); // Last 20 appointments
    }

    // Format appointments for AI context
    const appointmentContext = appointments.map(apt => ({
      appointmentId: apt._id,
      appointmentDate: apt.appointmentDate,
      notes: apt.notes,
      // TODO: OCR Model Integration Point
      // When OCR model extracts text from documents, it will be available in apt.ocrText
      ocrExtractedText: apt.ocrText || '',
      fileName: apt.fileName,
      // Add relevant user info based on role
      ...(userRole === 'Patient' && apt.doctorId ? {
        doctorName: apt.doctorId.name,
        doctorSpecialty: apt.doctorId.specialty,
        hospital: apt.doctorId.hospital
      } : {}),
      ...(userRole === 'Doctor' && apt.patientId ? {
        patientName: apt.patientId.name,
        patientAge: apt.patientId.age,
        patientGender: apt.patientId.gender
      } : {})
    }));

    // Get recent chat history for context
    const recentMessages = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .sort({ createdAt: 1 }); // Last 10 messages in chronological order

    const chatHistory = recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message
    }));

    // Generate AI response
    const aiResponseText = await generateAIResponse(
      message,
      appointmentContext,
      chatHistory,
      userRole
    );

    // Save AI response
    const aiMessage = new ChatMessage({
      userId,
      sender: 'ai',
      message: aiResponseText
    });
    await aiMessage.save();

    res.json({
      success: true,
      data: {
        userMessage,
        aiMessage
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};
