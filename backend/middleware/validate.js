const { validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
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

// Validation rules for user registration
const validateRegistration = [
  require('express-validator').body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  require('express-validator').body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  require('express-validator').body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  require('express-validator').body('role')
    .isIn(['student', 'alumni'])
    .withMessage('Role must be either student or alumni'),
  
  handleValidationErrors
];

// Validation rules for login
const validateLogin = [
  require('express-validator').body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  require('express-validator').body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login validation failed:', errors.array());
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
  }
];

// Validation rules for post creation
const validatePost = [
  require('express-validator').body('caption')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Caption cannot exceed 1000 characters'),
  
  handleValidationErrors
];

// Validation rules for query creation
const validateQuery = [
  require('express-validator').body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  require('express-validator').body('content')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Content must be between 10 and 1000 characters'),
  
  require('express-validator').body('category')
    .isIn(['career-guidance', 'interview-prep', 'job-search', 'skill-development', 'industry-insights', 'networking', 'resume', 'other'])
    .withMessage('Invalid category'),
  
  handleValidationErrors
];

// Validation rules for connection request
const validateConnectionRequest = [
  require('express-validator').body('alumniId')
    .isMongoId()
    .withMessage('Valid alumni ID is required'),
  
  require('express-validator').body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Validation rules for message sending
const validateMessage = [
  require('express-validator').body('receiver')
    .isMongoId()
    .withMessage('Valid receiver ID is required'),
  
  require('express-validator').body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  
  handleValidationErrors
];

// Validation rules for pagination
const validatePagination = [
  require('express-validator').query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  require('express-validator').query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Validation rules for profile update
const validateProfileUpdate = [
  require('express-validator').body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  require('express-validator').body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  require('express-validator').body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  require('express-validator').body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  require('express-validator').body('linkedin')
    .optional()
    .isURL()
    .withMessage('Please provide a valid LinkedIn URL'),
  
  require('express-validator').body('github')
    .optional()
    .isURL()
    .withMessage('Please provide a valid GitHub URL'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validatePost,
  validateQuery,
  validateConnectionRequest,
  validateMessage,
  validatePagination,
  validateProfileUpdate
}; 