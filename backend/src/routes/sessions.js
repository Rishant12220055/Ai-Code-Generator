import express from 'express';
import {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
  archiveSession,
  duplicateSession,
  getSessionStats
} from '../controllers/sessionController.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateSessionCreation,
  validateSessionUpdate,
  validatePagination
} from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Session routes
router.post('/', validateSessionCreation, createSession);
router.get('/', validatePagination, getSessions);
router.get('/stats', getSessionStats);
router.get('/:sessionId', getSession);
router.put('/:sessionId', validateSessionUpdate, updateSession);
router.delete('/:sessionId', deleteSession);
router.put('/:sessionId/archive', archiveSession);
router.post('/:sessionId/duplicate', duplicateSession);

export default router;