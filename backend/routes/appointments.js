import express from 'express';
import {
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
} from '../controllers/appointmentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/grouped', getGroupedAppointments);
router.get('/doctors', getRelatedUsers);
router.get('/', getAppointments);
router.get('/:id', getAppointment);
router.post('/', uploadMiddleware, createAppointment);
router.put('/:id', updateAppointment);
router.post('/:id/upload', uploadMiddleware, uploadDocument);
router.delete('/:id/document/:documentId', removeDocument);
router.delete('/:id', deleteAppointment);

export default router;
