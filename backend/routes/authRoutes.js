const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/authController");

const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validationMiddleware");

/*
============================================================
LOGIN RATE LIMITER
============================================================

20 login attempts per 15 minutes per IP.
============================================================
*/

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    error:
      "Too many login attempts. Please try again later.",
  },
});

/*
============================================================
REGISTRATION RATE LIMITER
============================================================

10 registration attempts per 15 minutes per IP.
============================================================
*/

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    error:
      "Too many registration attempts. Please try again later.",
  },
});

/*
============================================================
AUTH ROUTES
============================================================
*/

/*
------------------------------------------------------------
REGISTER
------------------------------------------------------------
*/

router.post(
  "/register",
  registerLimiter,
  ...validateRegistration,
  register
);

/*
------------------------------------------------------------
LOGIN
------------------------------------------------------------
*/

router.post(
  "/login",
  loginLimiter,
  ...validateLogin,
  login
);

/*
------------------------------------------------------------
LOGOUT
------------------------------------------------------------
*/

router.post(
  "/logout",
  logout
);

/*
------------------------------------------------------------
CURRENT USER
------------------------------------------------------------
*/

router.get(
  "/me",
  getMe
);

/*
============================================================
EXPORT
============================================================
*/

module.exports = router;