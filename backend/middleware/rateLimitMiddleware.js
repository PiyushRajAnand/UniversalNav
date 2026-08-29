const rateLimit = require("express-rate-limit");

/*
============================================================
LOGIN RATE LIMITER
============================================================
20 attempts per 15 minutes per IP
============================================================
*/

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    error: "Too many login attempts. Please try again later.",
  },
});

/*
============================================================
SIGNUP RATE LIMITER
============================================================
10 attempts per 15 minutes per IP
============================================================
*/

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    error: "Too many signup attempts. Please try again later.",
  },
});

/*
============================================================
FORGOT PASSWORD RATE LIMITER
============================================================
5 attempts per 15 minutes per IP
============================================================
*/

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    error:
      "Too many password reset requests. Please try again later.",
  },
});

module.exports = {
  loginLimiter,
  signupLimiter,
  forgotPasswordLimiter,
};