const { body, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorString = errors.array().map((err) => `${err.path}: ${err.msg}`).join(', ');
    res.status(400);
    return next(new Error(errorString));
  }
  next();
};

const validateRegistration = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const validateProperty = [
  body('name').trim().notEmpty().withMessage('Property name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  validate
];

const validateNavigation = [
  query('startNodeId').isMongoId().withMessage('Invalid startNodeId format'),
  query('endNodeId').isMongoId().withMessage('Invalid endNodeId format'),
  validate
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProperty,
  validateNavigation
};
