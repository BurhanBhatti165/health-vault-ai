import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import Appointment from '../models/Appointment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Process document with LangGraph workflow
 * Extracts medical data and generates summary
 */
export const processDocumentWithLangGraph = async (req, res) => {
  try {
    const { appointmentId, documentId } = req.params;
    const userId = req.userId;

    console.log('🔬 [LangGraph] Processing document:', { appointmentId, documentId });

    // Get appointment and verify access
    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify user has access
    if (appointment.patientId._id.toString() !== userId && appointment.doctorId._id.toString() !== userId) {
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

    // Download image from Cloudinary and convert to base64
    const imageUrl = document.cloudStorageURL;
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // Build patient history from all previous appointments
    const patientHistory = [];
    const allAppointments = await Appointment.find({ 
      patientId: appointment.patientId._id 
    }).sort({ appointmentDate: -1 });

    for (const apt of allAppointments) {
      if (apt.notes) {
        patientHistory.push({
          diagnosis: apt.notes,
          medicines: [],
          date: apt.appointmentDate
        });
      }
      // Add extracted data from previous documents
      for (const doc of apt.documents) {
        if (doc.ocrText) {
          patientHistory.push({
            diagnosis: doc.ocrText.substring(0, 200),
            medicines: [],
            date: apt.appointmentDate
          });
        }
      }
    }

    // Prepare input for LangGraph
    const langGraphInput = {
      image_base64: imageBase64,
      patient_history: patientHistory.slice(0, 10) // Last 10 records
    };

    console.log('📤 [LangGraph] Calling Python service...');

    // Call Python LangGraph service
    const result = await callLangGraphService(langGraphInput);

    if (!result.success) {
      throw new Error(result.error || 'LangGraph processing failed');
    }

    console.log('✅ [LangGraph] Processing complete:', result);

    // Update document with extracted data
    document.ocrText = JSON.stringify(result.extracted_data, null, 2);
    
    // Update appointment notes with summary
    if (result.final_summary) {
      appointment.notes = (appointment.notes || '') + '\n\n[AI Summary]\n' + result.final_summary;
    }

    await appointment.save();

    res.json({
      success: true,
      data: {
        appointment,
        langGraphResult: result
      }
    });

  } catch (error) {
    console.error('❌ [LangGraph] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process document with LangGraph',
      error: error.message
    });
  }
};

/**
 * Helper function to call Python LangGraph service
 */
function callLangGraphService(input) {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '../services/langGraphService.py');
    
    console.log('🐍 [LangGraph] Spawning Python process:', pythonScriptPath);
    
    const python = spawn('python', [pythonScriptPath]);
    
    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('🐍 [Python stderr]:', data.toString());
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      } else {
        reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });

    // Send input to Python script
    python.stdin.write(JSON.stringify(input));
    python.stdin.end();
  });
}

/**
 * Get LangGraph analysis for an appointment
 */
export const getAppointmentAnalysis = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.userId;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'name email age gender')
      .populate('doctorId', 'name email specialty');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify access
    if (appointment.patientId._id.toString() !== userId && appointment.doctorId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Extract all medical data from documents
    const medicalData = {
      diagnosis: [],
      medicines: [],
      documents: []
    };

    for (const doc of appointment.documents) {
      if (doc.ocrText) {
        try {
          const parsed = JSON.parse(doc.ocrText);
          if (parsed.diagnosis) medicalData.diagnosis.push(parsed.diagnosis);
          if (parsed.medicines) medicalData.medicines.push(...parsed.medicines);
        } catch (e) {
          // If not JSON, just add as text
          medicalData.documents.push({
            fileName: doc.fileName,
            text: doc.ocrText
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        appointment: {
          id: appointment._id,
          date: appointment.appointmentDate,
          patient: appointment.patientId.name,
          doctor: appointment.doctorId.name,
          notes: appointment.notes
        },
        analysis: medicalData
      }
    });

  } catch (error) {
    console.error('❌ [LangGraph] Error getting analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment analysis'
    });
  }
};
