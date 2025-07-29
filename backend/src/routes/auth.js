import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
} from '../controllers/authController.js';
import {
  authenticate,
  logout as logoutMiddleware
} from '../middleware/auth.js';
import {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors
} from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { body } from 'express-validator';

const router = express.Router();

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/refresh-token', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  handleValidationErrors
], refreshToken);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', logoutMiddleware, logout);
router.get('/profile', getProfile);
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Invalid theme'),
  body('preferences.defaultModel')
    .optional()
    .isString()
    .withMessage('Default model must be a string'),
  body('preferences.autoSave')
    .optional()
    .isBoolean()
    .withMessage('Auto save must be a boolean'),
  handleValidationErrors
], updateProfile);

router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
], changePassword);

router.delete('/account', [
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
], deleteAccount);

export default router;