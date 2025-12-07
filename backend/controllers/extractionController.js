import Appointment from '../models/Appointment.js';
import { extractText } from '../services/extractionService.js';

/**
 * Extract text from document using selected method
 * @route POST /api/extract/:appointmentId/:documentId
 * @param method - 'gemini' or 'ocr' (query parameter)
 */
export const extractDocument = async (req, res) => {
  try {
    const { appointmentId, documentId } = req.params;
    const { method = 'gemini' } = req.query; // Default to Gemini
    const userId = req.userId;

    console.log(`🔍 [Extract] Processing document with method: ${method}`);

    // Get appointment and verify access
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify user has access
    if (appointment.patientId.toString() !== userId && appointment.doctorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find the document
    const document = appointment.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Extract text using selected method
    const extractionResult = await extractText(document.cloudStorageURL, method);

    if (!extractionResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Extraction failed',
        error: extractionResult.error
      });
    }

    // Update document with extracted data
    document.ocrText = JSON.stringify(extractionResult.data, null, 2);
    await appointment.save();

    console.log('✅ [Extract] Document updated successfully');

    res.json({
      success: true,
      data: {
        appointment,
        extractedData: extractionResult.data,
        method: method
      }
    });

  } catch (error) {
    console.error('❌ [Extract] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract document',
      error: error.message
    });
  }
};

/**
 * Get available extraction methods
 */
export const getExtractionMethods = async (req, res) => {
  const methods = [
    {
      id: 'gemini',
      name: 'Google Gemini Vision',
      description: 'Advanced AI vision model for detailed medical document analysis',
      features: [
        'Structured data extraction',
        'High accuracy',
        'Understands medical terminology',
        'Extracts diagnosis, medicines, doctor info, and more'
      ],
      recommended: true
    }
  ];

  res.json({
    success: true,
    data: { methods }
  });
};
