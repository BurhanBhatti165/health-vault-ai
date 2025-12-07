import express from 'express';
import {
  extractDocument,
  getExtractionMethods
} from '../controllers/extractionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Get available extraction methods
router.get('/methods', getExtractionMethods);

// Extract text from document with selected method
// Query param: ?method=gemini or ?method=ocr
router.post('/:appointmentId/:documentId', extractDocument);

export default router;
