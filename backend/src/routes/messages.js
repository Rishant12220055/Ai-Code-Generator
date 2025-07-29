import express from 'express';
import {
  sendMessage,
  getMessages,
  deleteMessage,
  editMessage,
  regenerateResponse
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateMessage,
  validatePagination,
  handleValidationErrors
} from '../middleware/validation.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Message routes
router.post('/:sessionId/messages', aiLimiter, validateMessage, sendMessage);
router.get('/:sessionId/messages', validatePagination, getMessages);
router.delete('/:sessionId/messages/:messageId', deleteMessage);
router.put('/:sessionId/messages/:messageId', [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters'),
  handleValidationErrors
], editMessage);
router.post('/:sessionId/messages/:messageId/regenerate', aiLimiter, regenerateResponse);

export default router;