import { body, param, query, validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// User validation rules
export const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  handleValidationErrors
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors
];

// Session validation rules
export const validateSessionCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Session name must be between 1 and 200 characters'),
    
  body('settings.model')
    .optional()
    .isIn(['gpt-4o-mini', 'gpt-4', 'claude-3-sonnet', 'llama-3'])
    .withMessage('Invalid AI model'),
    
  body('settings.temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
    
  body('settings.maxTokens')
    .optional()
    .isInt({ min: 100, max: 4000 })
    .withMessage('Max tokens must be between 100 and 4000'),
    
  handleValidationErrors
];

export const validateSessionUpdate = [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID'),
    
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Session name must be between 1 and 200 characters'),
    
  handleValidationErrors
];

// Message validation rules
export const validateMessage = [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID'),
    
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters'),
    
  body('type')
    .optional()
    .isIn(['user', 'assistant'])
    .withMessage('Message type must be either user or assistant'),
    
  handleValidationErrors
];

// Component validation rules
export const validateComponent = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Component name must be between 1 and 100 characters'),
    
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
    
  body('jsx')
    .notEmpty()
    .withMessage('JSX code is required'),
    
  body('css')
    .notEmpty()
    .withMessage('CSS code is required'),
    
  body('category')
    .optional()
    .isIn(['button', 'form', 'card', 'navigation', 'layout', 'data-display', 'feedback', 'other'])
    .withMessage('Invalid category'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
    
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
    
  handleValidationErrors
];

// Property edit validation rules
export const validatePropertyEdit = [
  param('componentId')
    .isMongoId()
    .withMessage('Invalid component ID'),
    
  body('elementId')
    .trim()
    .notEmpty()
    .withMessage('Element ID is required'),
    
  body('property')
    .trim()
    .notEmpty()
    .withMessage('Property name is required'),
    
  body('value')
    .trim()
    .notEmpty()
    .withMessage('Property value is required'),
    
  handleValidationErrors
];

// Query validation rules
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name'])
    .withMessage('Invalid sort parameter'),
    
  handleValidationErrors
];

export const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
    
  query('category')
    .optional()
    .isIn(['button', 'form', 'card', 'navigation', 'layout', 'data-display', 'feedback', 'other'])
    .withMessage('Invalid category'),
    
  handleValidationErrors
];

// File upload validation
export const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
    });
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 10MB'
    });
  }

  next();
};