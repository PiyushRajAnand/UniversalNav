const {
  body,
  query,
  validationResult,
} = require("express-validator");

// ============================================================
// COMMON VALIDATION HANDLER
// ============================================================
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return res.status(400).json({
    success: false,
    error: "Validation failed",
    errors: formattedErrors,
  });
};

// ============================================================
// REGISTRATION VALIDATION
// ============================================================
const validateRegistration = [
  // -------------------------
  // NAME
  // -------------------------
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  // -------------------------
  // EMAIL
  // -------------------------
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  // -------------------------
  // PASSWORD
  // -------------------------
  body("password")
    .isString()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character"),

  validate,
];

// ============================================================
// LOGIN VALIDATION
// ============================================================
const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Password is required")
    .notEmpty()
    .withMessage("Password is required"),

  validate,
];

// ============================================================
// PROPERTY VALIDATION
// ============================================================
const validateProperty = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Property name is required")
    .isLength({ max: 200 })
    .withMessage("Property name must not exceed 200 characters"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ max: 500 })
    .withMessage("Address must not exceed 500 characters"),

  validate,
];

// ============================================================
// NAVIGATION VALIDATION
// ============================================================
const validateNavigation = [
  query("startNodeId")
    .trim()
    .isMongoId()
    .withMessage("Invalid startNodeId format"),

  query("endNodeId")
    .trim()
    .isMongoId()
    .withMessage("Invalid endNodeId format"),

  validate,
];

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  validateRegistration,
  validateLogin,
  validateProperty,
  validateNavigation,
};