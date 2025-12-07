import ChatMessage from '../models/ChatMessage.js';
import Appointment from '../models/Appointment.js';
import { generateAIResponse } from '../config/gemini.js';

// @route   GET /api/chat/messages/:appointmentId
// @desc    Get chat history for a specific appointment
// @access  Private
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { appointmentId } = req.params;

    // Verify user has access to this appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.patientId.toString() !== userId && appointment.doctorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await ChatMessage.find({ appointmentId })
      .sort({ createdAt: 1 })
      .limit(100);

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

// @route   POST /api/chat/send/:appointmentId
// @desc    Send message to AI assistant for specific appointment
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { appointmentId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get appointment with full details
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'name specialty hospital email')
      .populate('patientId', 'name email age gender');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify user has access to this appointment
    if (appointment.patientId._id.toString() !== userId && appointment.doctorId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Save user message
    const userMessage = new ChatMessage({
      userId,
      appointmentId,
      sender: 'user',
      message: message.trim()
    });
    await userMessage.save();

    // Build appointment-specific context
    const appointmentContext = {
      appointmentId: appointment._id,
      appointmentDate: appointment.appointmentDate,
      notes: appointment.notes || '',
      documents: appointment.documents.map(doc => ({
        fileName: doc.fileName,
        fileType: doc.fileType,
        ocrText: doc.ocrText || '',
        uploadedAt: doc.uploadedAt
      })),
      // Add doctor info if user is patient
      ...(userRole === 'Patient' && appointment.doctorId ? {
        doctorName: appointment.doctorId.name,
        doctorSpecialty: appointment.doctorId.specialty,
        doctorHospital: appointment.doctorId.hospital
      } : {}),
      // Add patient info if user is doctor
      ...(userRole === 'Doctor' && appointment.patientId ? {
        patientName: appointment.patientId.name,
        patientAge: appointment.patientId.age,
        patientGender: appointment.patientId.gender
      } : {})
    };

    // Get chat history for this appointment only
    const recentMessages = await ChatMessage.find({ appointmentId })
      .sort({ createdAt: 1 })
      .limit(20);

    const chatHistory = recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message
    }));

    // Generate AI response with appointment-specific context
    const aiResponseText = await generateAIResponse(
      message,
      appointmentContext,
      chatHistory,
      userRole
    );

    // Save AI response
    const aiMessage = new ChatMessage({
      userId,
      appointmentId,
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
