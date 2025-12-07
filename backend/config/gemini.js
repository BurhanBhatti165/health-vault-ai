import axios from 'axios';

/**
 * Generate AI response using Hugging Face Inference API (100% FREE)
 * @param {string} userMessage - The user's message
 * @param {Array} appointmentContext - Array of user's appointments for context
 * @param {Array} chatHistory - Recent chat history for context
 * @param {string} userRole - User's role (Patient or Doctor)
 * @returns {Promise<string>} - AI generated response
 */
export const generateAIResponse = async (userMessage, appointmentContext = [], chatHistory = [], userRole = 'Patient') => {
  try {
    console.log('🤖 AI API called with:', {
      userMessage,
      appointmentCount: appointmentContext.length,
      chatHistoryCount: chatHistory.length,
      userRole
    });

    // Build context from user's appointments
    let contextText = '';
    
    if (appointmentContext && appointmentContext.length > 0) {
      contextText = `\n\nMedical Records (${appointmentContext.length} appointments):\n\n`;
      
      appointmentContext.forEach((apt, index) => {
        contextText += `Appointment ${index + 1}:\n`;
        contextText += `Date: ${new Date(apt.appointmentDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}\n`;
        
        if (userRole === 'Patient' && apt.doctorName) {
          contextText += `Doctor: ${apt.doctorName}`;
          if (apt.doctorSpecialty) contextText += ` (${apt.doctorSpecialty})`;
          contextText += '\n';
        }

        if (userRole === 'Doctor' && apt.patientName) {
          contextText += `Patient: ${apt.patientName}`;
          if (apt.patientAge) contextText += `, Age: ${apt.patientAge}`;
          contextText += '\n';
        }
        
        if (apt.notes) {
          contextText += `Notes: ${apt.notes}\n`;
        }
        
        contextText += '\n';
      });
    }

    // Create prompt
    const prompt = `You are a medical AI assistant. ${contextText}

User question: ${userMessage}

Provide a helpful, professional response:`;

    console.log('📤 Sending request to Hugging Face API...');

    // Call Hugging Face API (100% FREE, no API key needed)
    const response = await axios.post(
      'https://router.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct',
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ AI response received');

    if (response.data && response.data[0] && response.data[0].generated_text) {
      let aiText = response.data[0].generated_text;
      
      // Remove the prompt from response
      aiText = aiText.replace(prompt, '').trim();
      
      console.log('✅ AI response generated:', aiText.substring(0, 100) + '...');
      return aiText || 'I received your question. How can I help you with your health concerns?';
    } else {
      console.error('❌ Unexpected API response:', response.data);
      return 'I received your question. Could you please rephrase it?';
    }
  } catch (error) {
    console.error('❌ AI API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response?.status === 503) {
      return 'The AI model is currently loading. Please try again in a few seconds.';
    }
    
    return 'I apologize, but I encountered an error. Please try again.';
  }
};
