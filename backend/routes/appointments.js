import express from 'express';
import {
  uploadMiddleware,
  getAppointments,
  getRelatedUsers,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from '../controllers/appointmentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/doctors', getRelatedUsers);
router.get('/', getAppointments);
router.get('/:id', getAppointment);
router.post('/', uploadMiddleware, createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
