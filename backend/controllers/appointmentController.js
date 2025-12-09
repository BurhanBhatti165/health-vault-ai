import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import multer from 'multer';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { extractText } from '../config/ocr.js';
import fs from 'fs';

// Configure multer for serverless environment
const upload = multer({ 
  dest: process.env.NODE_ENV === 'production' ? '/tmp/' : 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadMiddleware = upload.single('file');

// @route   GET /api/appointments
// @desc    Get appointments based on user role
// @access  Private
const getAppointments = async (req, res) => {
  try {
    let query;
    
    if (req.userRole === 'Patient') {
      // Patient sees their own appointments
      query = { patientId: req.userId };
    } else if (req.userRole === 'Doctor') {
      // Doctor sees appointments where they are the doctor
      query = { doctorId: req.userId };
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialty hospital email profileImage bio')
      .populate('patientId', 'name email profileImage bio')
      .sort({ appointmentDate: -1 });
    
    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching appointments' 
    });
  }
};

// @route   GET /api/appointments/grouped
// @desc    Get appointments grouped by doctor (for patient) or by patient (for doctor)
// @access  Private
const getGroupedAppointments = async (req, res) => {
  try {
    if (req.userRole === 'Patient') {
      // Patient sees doctor cards with their appointments
      const appointments = await Appointment.find({ patientId: req.userId })
        .populate('doctorId', 'name specialty hospital email phone profileImage bio')
        .sort({ appointmentDate: -1 });
      
      // Group by doctor
      const grouped = appointments.reduce((acc, appointment) => {
        const doctorId = appointment.doctorId._id.toString();
        if (!acc[doctorId]) {
          acc[doctorId] = {
            doctor: appointment.doctorId,
            appointments: []
          };
        }
        acc[doctorId].appointments.push(appointment);
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: { cards: Object.values(grouped) }
      });
    } else if (req.userRole === 'Doctor') {
      // Doctor sees patient cards with their appointments
      const appointments = await Appointment.find({ doctorId: req.userId })
        .populate('patientId', 'name email profileImage bio')
        .sort({ appointmentDate: -1 });
      
      // Group by patient
      const grouped = appointments.reduce((acc, appointment) => {
        const patientId = appointment.patientId._id.toString();
        if (!acc[patientId]) {
          acc[patientId] = {
            patient: appointment.patientId,
            appointments: []
          };
        }
        acc[patientId].appointments.push(appointment);
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: { cards: Object.values(grouped) }
      });
    }
  } catch (error) {
    console.error('Get grouped appointments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching grouped appointments' 
    });
  }
};

// @route   GET /api/appointments/doctors
// @desc    Get list of doctors (for patient) or patients (for doctor)
// @access  Private
const getRelatedUsers = async (req, res) => {
  try {
    if (req.userRole === 'Patient') {
      // Patient gets list of all doctors
      const doctors = await User.find({ role: 'Doctor' })
        .select('name specialty hospital email phone profileImage bio');
      
      res.json({
        success: true,
        data: { doctors }
      });
    } else if (req.userRole === 'Doctor') {
      // Doctor gets list of their patients
      const appointments = await Appointment.find({ doctorId: req.userId })
        .distinct('patientId');
      
      const patients = await User.find({ _id: { $in: appointments } })
        .select('name email profileImage bio');
      
      res.json({
        success: true,
        data: { patients }
      });
    }
  } catch (error) {
    console.error('Get related users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
};

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name specialty hospital email profileImage bio')
      .populate('patientId', 'name email profileImage bio');
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    // Check access
    if (req.userRole === 'Patient' && appointment.patientId._id.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
    
    if (req.userRole === 'Doctor' && appointment.doctorId._id.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
    
    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching appointment' 
    });
  }
};

// @route   POST /api/appointments
// @desc    Create appointment with optional file upload
// @access  Private (Patient only)
const createAppointment = async (req, res) => {
  console.log('📝 [Backend] Create appointment request received');
  console.log('📝 [Backend] User role:', req.userRole);
  console.log('📝 [Backend] Body:', req.body);
  console.log('📝 [Backend] File:', req.file ? req.file.originalname : 'No file');
  
  try {
    if (req.userRole !== 'Patient') {
      console.log('⚠️ [Backend] User is not a patient');
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ 
        success: false, 
        message: 'Only patients can create appointments' 
      });
    }

    const { doctorId, appointmentDate, notes } = req.body;

    if (!doctorId || !appointmentDate) {
      console.log('⚠️ [Backend] Missing required fields');
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor and appointment date are required' 
      });
    }

    // Verify doctor exists
    console.log('🔍 [Backend] Verifying doctor:', doctorId);
    const doctor = await User.findOne({ _id: doctorId, role: 'Doctor' });
    if (!doctor) {
      console.log('❌ [Backend] Doctor not found');
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }
    console.log('✅ [Backend] Doctor verified:', doctor.name);

    const documents = [];

    // Process file if uploaded
    if (req.file) {
      console.log('📤 [Backend] Processing file:', req.file.originalname);
      console.log('📤 [Backend] Uploading to Cloudinary...');
      const cloudURL = await uploadToCloudinary(req.file);
      console.log('✅ [Backend] Cloudinary upload complete:', cloudURL);
      
      console.log('🔍 [Backend] Extracting text with OCR...');
      const ocrText = await extractText(req.file.path);
      console.log('✅ [Backend] OCR complete, text length:', ocrText.length);
      
      // Add to documents array
      documents.push({
        cloudStorageURL: cloudURL,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        ocrText: ocrText,
        uploadedAt: new Date()
      });
      
      fs.unlinkSync(req.file.path);
    }

    console.log('💾 [Backend] Creating appointment in database...');
    const appointment = new Appointment({
      patientId: req.userId,
      doctorId,
      appointmentDate,
      documents,
      notes
    });

    await appointment.save();
    await appointment.populate('doctorId', 'name specialty hospital email profileImage bio');
    console.log('✅ [Backend] Appointment created:', appointment._id);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('❌ [Backend] Create appointment error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error creating appointment' 
    });
  }
};

// @route   PUT /api/appointments/:id
// @desc    Update appointment notes (Patient only)
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    // Only patient can update
    if (req.userRole !== 'Patient' || appointment.patientId.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Only allow updating notes and appointmentDate
    const { notes, appointmentDate } = req.body;
    if (notes !== undefined) appointment.notes = notes;
    if (appointmentDate !== undefined) appointment.appointmentDate = appointmentDate;
    
    await appointment.save();
    await appointment.populate('doctorId', 'name specialty hospital email profileImage bio');

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating appointment' 
    });
  }
};

// @route   POST /api/appointments/:id/upload
// @desc    Upload document to appointment (Patient only) - supports multiple files
// @access  Private
const uploadDocument = async (req, res) => {
  console.log('📤 [Backend] Upload document request for appointment:', req.params.id);
  console.log('📤 [Backend] File:', req.file ? req.file.originalname : 'No file');
  
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      console.log('❌ [Backend] Appointment not found');
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    // Only patient can upload
    if (req.userRole !== 'Patient' || appointment.patientId.toString() !== req.userId) {
      console.log('⚠️ [Backend] Not authorized to upload');
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    if (!req.file) {
      console.log('⚠️ [Backend] No file provided');
      return res.status(400).json({ 
        success: false, 
        message: 'No file provided' 
      });
    }

    // Upload new file
    console.log('📤 [Backend] Uploading to Cloudinary...');
    const cloudURL = await uploadToCloudinary(req.file);
    console.log('✅ [Backend] Cloudinary upload complete:', cloudURL);
    
    console.log('🔍 [Backend] Extracting text with OCR...');
    const ocrText = await extractText(req.file.path);
    console.log('✅ [Backend] OCR complete, text length:', ocrText.length);
    
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;
    
    // Clean up temp file
    fs.unlinkSync(req.file.path);

    // Add document to array
    console.log('💾 [Backend] Adding document to appointment...');
    appointment.documents.push({
      cloudStorageURL: cloudURL,
      fileName: fileName,
      fileType: fileType,
      ocrText: ocrText,
      uploadedAt: new Date()
    });
    
    await appointment.save();
    await appointment.populate('doctorId', 'name specialty hospital email profileImage bio');
    console.log('✅ [Backend] Document added, total documents:', appointment.documents.length);

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('❌ [Backend] Upload document error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading document' 
    });
  }
};

// @route   DELETE /api/appointments/:id/document/:documentId
// @desc    Remove specific document from appointment (Patient only)
// @access  Private
const removeDocument = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    // Only patient can remove document
    if (req.userRole !== 'Patient' || appointment.patientId.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const { documentId } = req.params;
    
    // Remove document from array
    appointment.documents = appointment.documents.filter(
      doc => doc._id.toString() !== documentId
    );
    
    await appointment.save();
    await appointment.populate('doctorId', 'name specialty hospital email profileImage bio');

    res.json({
      success: true,
      message: 'Document removed successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Remove document error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error removing document' 
    });
  }
};

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment (Patient only)
// @access  Private
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    // Only patient can delete
    if (req.userRole !== 'Patient' || appointment.patientId.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    await appointment.deleteOne();

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting appointment' 
    });
  }
};

export {
  uploadMiddleware,
  getAppointments,
  getGroupedAppointments,
  getRelatedUsers,
  getAppointment,
  createAppointment,
  updateAppointment,
  uploadDocument,
  removeDocument,
  deleteAppointment
};
