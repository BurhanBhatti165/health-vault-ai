import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  cloudStorageURL: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  ocrText: {
    type: String,
    default: ''
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  documents: [documentSchema],
  notes: {
    type: String,
    trim: true
  },
  // Legacy fields for backward compatibility
  cloudStorageURL: {
    type: String,
    default: ''
  },
  ocrText: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    trim: true
  },
  fileType: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
appointmentSchema.index({ patientId: 1, doctorId: 1, appointmentDate: -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
