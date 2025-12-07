import express from 'express';
import {
  processDocumentWithLangGraph,
  getAppointmentAnalysis
} from '../controllers/langGraphController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Process a document with LangGraph workflow
router.post('/process/:appointmentId/:documentId', processDocumentWithLangGraph);

// Get LangGraph analysis for an appointment
router.get('/analysis/:appointmentId', getAppointmentAnalysis);

export default router;
