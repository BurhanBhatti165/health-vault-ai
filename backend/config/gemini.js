import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate AI response using Google Gemini API (FREE tier: 15 requests/min)
 * @param {string} userMessage - The user's message
 * @param {Object} appointmentContext - Specific appointment data for context
 * @param {Array} chatHistory - Recent chat history for context
 * @param {string} userRole - User's role (Patient or Doctor)
 * @returns {Promise<string>} - AI generated response
 */
export const generateAIResponse = async (userMessage, appointmentContext = {}, chatHistory = [], userRole = 'Patient') => {
  try {
    console.log('🤖 Gemini API called with:', {
      userMessage,
      hasAppointmentContext: !!appointmentContext.appointmentId,
      documentCount: appointmentContext.documents?.length || 0,
      documentsWithOCR: appointmentContext.documents?.filter(d => d.ocrText).length || 0,
      chatHistoryCount: chatHistory.length,
      userRole
    });
    
    // Log document details for debugging
    if (appointmentContext.documents && appointmentContext.documents.length > 0) {
      console.log('📄 Documents in context:');
      appointmentContext.documents.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.fileName} - OCR: ${doc.ocrText ? 'Yes (' + doc.ocrText.length + ' chars)' : 'No'}`);
      });
    }

    // Build context from specific appointment
    let contextText = '';
    
    if (appointmentContext && appointmentContext.appointmentId) {
      contextText = `\n\nAPPOINTMENT CONTEXT:\n\n`;
      
      contextText += `Date: ${new Date(appointmentContext.appointmentDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}\n`;
      
      if (userRole === 'Patient' && appointmentContext.doctorName) {
        contextText += `Doctor: ${appointmentContext.doctorName}`;
        if (appointmentContext.doctorSpecialty) contextText += ` (${appointmentContext.doctorSpecialty})`;
        if (appointmentContext.doctorHospital) contextText += ` at ${appointmentContext.doctorHospital}`;
        contextText += '\n';
      }

      if (userRole === 'Doctor' && appointmentContext.patientName) {
        contextText += `Patient: ${appointmentContext.patientName}`;
        if (appointmentContext.patientAge) contextText += `, Age: ${appointmentContext.patientAge}`;
        if (appointmentContext.patientGender) contextText += `, Gender: ${appointmentContext.patientGender}`;
        contextText += '\n';
      }
      
      if (appointmentContext.notes) {
        contextText += `\nAppointment Notes:\n${appointmentContext.notes}\n`;
      }

      // Add document information - ALL documents with their extracted data
      if (appointmentContext.documents && appointmentContext.documents.length > 0) {
        contextText += `\nMedical Documents (${appointmentContext.documents.length} total):\n`;
        contextText += `${'='.repeat(50)}\n`;
        
        appointmentContext.documents.forEach((doc, index) => {
          contextText += `\n📄 Document ${index + 1}: ${doc.fileName}\n`;
          contextText += `   Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}\n`;
          
          if (doc.ocrText && doc.ocrText.trim()) {
            // Try to parse as JSON for better formatting
            try {
              const parsedData = JSON.parse(doc.ocrText);
              contextText += `   Extracted Data:\n`;
              
              if (parsedData.document_type) {
                contextText += `   - Type: ${parsedData.document_type}\n`;
              }
              if (parsedData.diagnosis) {
                contextText += `   - Diagnosis: ${parsedData.diagnosis}\n`;
              }
              if (parsedData.medicines && parsedData.medicines.length > 0) {
                contextText += `   - Medicines: ${parsedData.medicines.join(', ')}\n`;
              }
              if (parsedData.doctor_name) {
                contextText += `   - Doctor: ${parsedData.doctor_name}\n`;
              }
              if (parsedData.date) {
                contextText += `   - Date: ${parsedData.date}\n`;
              }
              if (parsedData.instructions) {
                contextText += `   - Instructions: ${parsedData.instructions}\n`;
              }
              if (parsedData.test_results) {
                contextText += `   - Test Results: ${parsedData.test_results}\n`;
              }
              if (parsedData.vital_signs) {
                contextText += `   - Vital Signs: ${parsedData.vital_signs}\n`;
              }
              if (parsedData.additional_notes) {
                contextText += `   - Additional Notes: ${parsedData.additional_notes}\n`;
              }
              
              // Include raw text if available
              if (parsedData.raw_text) {
                contextText += `   - Full Text: ${parsedData.raw_text.substring(0, 500)}\n`;
              }
            } catch (e) {
              // Not JSON, include as plain text
              contextText += `   Extracted Text:\n${doc.ocrText.substring(0, 1000)}\n`;
            }
          } else {
            contextText += `   (No extracted text available yet)\n`;
          }
          
          contextText += `\n`;
        });
        
        contextText += `${'='.repeat(50)}\n`;
      }
      
      contextText += '\n';
    }

    // Build chat history for Gemini
    const history = chatHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Create system instruction
    const systemInstruction = `You are a helpful medical AI assistant for HealthVault, a medical records management system. 
You help ${userRole === 'Patient' ? 'patients' : 'doctors'} understand their medical appointments, documents, and health information.
${contextText}

Guidelines:
- Provide clear, professional, and empathetic responses
- Reference specific information from the appointment context when relevant
- If asked about medical advice, remind users to consult their healthcare provider
- Be concise but thorough
- Use simple language, avoiding unnecessary medical jargon`;

    console.log('📤 Sending request to Google Gemini API...');

    // Get the generative model (gemini-pro is the free tier model)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction
    });

    // Start chat with history
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Send message
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const aiText = response.text();

    console.log('✅ Gemini response received:', aiText.substring(0, 100) + '...');
    
    return aiText || 'I received your question. How can I help you with your health concerns?';

  } catch (error) {
    console.error('❌ Gemini API Error:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText
    });
    
    if (error.message?.includes('API key')) {
      return 'API key error. Please check your Gemini API configuration.';
    }
    
    if (error.status === 429) {
      return 'Rate limit reached. Please wait a moment and try again.';
    }
    
    if (error.status === 503) {
      return 'The AI service is temporarily unavailable. Please try again in a few seconds.';
    }
    
    return 'I apologize, but I encountered an error. Please try again.';
  }
};
