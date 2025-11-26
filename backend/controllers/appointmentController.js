import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import multer from 'multer';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { extractText } from '../config/ocr.js';
import fs from 'fs';

// Configure multer
const upload = multer({ 
  dest: 'uploads/',
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
      .populate('doctorId', 'name specialty hospital email')
      .populate('patientId', 'name email')
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

// @route   GET /api/appointments/doctors
// @desc    Get list of doctors (for patient) or patients (for doctor)
// @access  Private
const getRelatedUsers = async (req, res) => {
  try {
    if (req.userRole === 'Patient') {
      // Patient gets list of all doctors
      const doctors = await User.find({ role: 'Doctor' })
        .select('name specialty hospital email phone');
      
      res.json({
        success: true,
        data: { doctors }
      });
    } else if (req.userRole === 'Doctor') {
      // Doctor gets list of their patients
      const appointments = await Appointment.find({ doctorId: req.userId })
        .distinct('patientId');
      
      const patients = await User.find({ _id: { $in: appointments } })
        .select('name email');
      
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
      .populate('doctorId', 'name specialty hospital email')
      .populate('patientId', 'name email');
    
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
  try {
    if (req.userRole !== 'Patient') {
      // Clean up file if exists
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ 
        success: false, 
        message: 'Only patients can create appointments' 
      });
    }

    const { doctorId, appointmentDate, notes } = req.body;

    if (!doctorId || !appointmentDate) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor and appointment date are required' 
      });
    }

    // Verify doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'Doctor' });
    if (!doctor) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }

    let cloudURL = '';
    let ocrText = '';
    let fileName = '';
    let fileType = '';

    // Process file if uploaded
    if (req.file) {
      cloudURL = await uploadToCloudinary(req.file);
      ocrText = await extractText(req.file.path);
      fileName = req.file.originalname;
      fileType = req.file.mimetype;
      fs.unlinkSync(req.file.path);
    }

    const appointment = new Appointment({
      patientId: req.userId,
      doctorId,
      appointmentDate,
      cloudStorageURL: cloudURL,
      ocrText,
      fileName,
      fileType,
      notes
    });

    await appointment.save();
    await appointment.populate('doctorId', 'name specialty hospital email');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
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
// @desc    Update appointment (Patient only)
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

    Object.assign(appointment, req.body);
    await appointment.save();
    await appointment.populate('doctorId', 'name specialty hospital email');

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
  getRelatedUsers,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
