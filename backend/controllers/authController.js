const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { AUTH } = require("../constants/responseMessages");

// ============================================================
// ENVIRONMENT
// ============================================================
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

// ============================================================
// SESSION COOKIE OPTIONS
// ============================================================
const SESSION_COOKIE_NAME = "universalnav.sid";

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? "none" : "lax",
};

// ============================================================
// REGISTER
// ============================================================
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    // ========================================================
    // CHECK EXISTING USER
    // ========================================================
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error:
          AUTH.USER_EXISTS ||
          "This email is already registered. Please log in instead.",
      });
    }

    // ========================================================
    // CREATE USER
    // ========================================================
    /*
      Never accept role from the frontend during registration.
      User model applies its default role.
    */
    const newUser = await User.create({
      name,
      email,
      passwordHash: password,
    });

    // ========================================================
    // CREATE NEW SESSION
    // ========================================================
    /*
      Regenerate the session after registration.
      This prevents session fixation and creates a fresh
      authenticated session for the newly registered user.
    */
    req.session.regenerate((err) => {
      if (err) {
        console.error(
          "Session regeneration error:",
          err
        );

        return res.status(500).json({
          success: false,
          error:
            AUTH.SESSION_ERROR ||
            "We couldn't start your session. Please try again.",
        });
      }

      // ======================================================
      // STORE USER ID
      // ======================================================
      req.session.userId = newUser._id.toString();

      // ======================================================
      // SAVE SESSION
      // ======================================================
      req.session.save(async (saveErr) => {
        if (saveErr) {
          console.error(
            "Session save error:",
            saveErr
          );

          return res.status(500).json({
            success: false,
            error:
              AUTH.SESSION_ERROR ||
              "We couldn't start your session. Please try again.",
          });
        }

        // ====================================================
        // AUDIT LOG
        // ====================================================
        try {
          await AuditLog.create({
            userId: newUser._id,
            email: newUser.email,
            action: "REGISTER",
            ipAddress: req.ip,
          });
        } catch (auditError) {
          /*
            Audit logging should not make a successful
            registration appear to have failed.
          */
          console.error(
            "Registration audit log error:",
            auditError
          );
        }

        // ====================================================
        // SUCCESS
        // ====================================================
        return res.status(201).json({
          success: true,
          message:
            AUTH.REGISTER_SUCCESS ||
            "Account created successfully",

          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
        });
      });
    });
  } catch (err) {
    // ========================================================
    // MONGODB DUPLICATE KEY
    // ========================================================
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        error:
          AUTH.USER_EXISTS ||
          "This email is already registered. Please log in instead.",
      });
    }

    return next(err);
  }
};

// ============================================================
// LOGIN
// ============================================================
const login = async (req, res, next) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // ========================================================
    // FIND USER
    // ========================================================
    const user = await User.findOne({ email });

    // ========================================================
    // VALIDATE CREDENTIALS
    // ========================================================
    /*
      Keep this message generic.

      We should never tell the client whether:
      - the email exists
      - the password was wrong
      - the account does not exist

      This prevents account enumeration.
    */
    if (
      !user ||
      !(await user.comparePassword(password))
    ) {
      return res.status(401).json({
        success: false,
        error:
          AUTH.INVALID_CREDENTIALS ||
          "Invalid email or password.",
      });
    }

    // ========================================================
    // REGENERATE SESSION
    // ========================================================
    /*
      Regenerating the session after successful authentication
      helps prevent session fixation attacks.
    */
    req.session.regenerate((err) => {
      if (err) {
        console.error(
          "Session regeneration error:",
          err
        );

        return res.status(500).json({
          success: false,
          error:
            AUTH.SESSION_ERROR ||
            "We couldn't start your session. Please try again.",
        });
      }

      // ======================================================
      // STORE USER ID
      // ======================================================
      req.session.userId = user._id.toString();

      // ======================================================
      // SAVE SESSION
      // ======================================================
      req.session.save(async (saveErr) => {
        if (saveErr) {
          console.error(
            "Session save error:",
            saveErr
          );

          return res.status(500).json({
            success: false,
            error:
              AUTH.SESSION_ERROR ||
              "We couldn't start your session. Please try again.",
          });
        }

        // ====================================================
        // AUDIT LOG
        // ====================================================
        try {
          await AuditLog.create({
            userId: user._id,
            email: user.email,
            action: "LOGIN",
            ipAddress: req.ip,
          });
        } catch (auditError) {
          /*
            Audit failure should not make a successful login
            appear to have failed.
          */
          console.error(
            "Login audit log error:",
            auditError
          );
        }

        // ====================================================
        // SUCCESS
        // ====================================================
        return res.json({
          success: true,
          message:
            AUTH.LOGIN_SUCCESS ||
            "Welcome back!",

          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      });
    });
  } catch (err) {
    return next(err);
  }
};

// ============================================================
// LOGOUT
// ============================================================
const logout = async (req, res, next) => {
  try {
    let user = null;

    // ========================================================
    // FIND CURRENT USER
    // ========================================================
    if (req.session?.userId) {
      user = await User.findById(
        req.session.userId
      );
    }

    // ========================================================
    // AUDIT LOG
    // ========================================================
    if (user) {
      try {
        await AuditLog.create({
          userId: user._id,
          email: user.email,
          action: "LOGOUT",
          ipAddress: req.ip,
        });
      } catch (auditError) {
        /*
          Audit failure should never prevent logout.
        */
        console.error(
          "Logout audit log error:",
          auditError
        );
      }
    }

    // ========================================================
    // NO SESSION
    // ========================================================
    if (!req.session) {
      res.clearCookie(
        SESSION_COOKIE_NAME,
        SESSION_COOKIE_OPTIONS
      );

      return res.json({
        success: true,
        message:
          AUTH.LOGOUT_SUCCESS ||
          "Logged out successfully",
      });
    }

    // ========================================================
    // DESTROY SESSION
    // ========================================================
    req.session.destroy((err) => {
      if (err) {
        console.error(
          "Logout session error:",
          err
        );

        return res.status(500).json({
          success: false,
          error:
            "We couldn't log you out. Please try again.",
        });
      }

      // ======================================================
      // CLEAR SESSION COOKIE
      // ======================================================
      res.clearCookie(
        SESSION_COOKIE_NAME,
        SESSION_COOKIE_OPTIONS
      );

      // ======================================================
      // SUCCESS
      // ======================================================
      return res.json({
        success: true,
        message:
          AUTH.LOGOUT_SUCCESS ||
          "Logged out successfully",
      });
    });
  } catch (err) {
    return next(err);
  }
};

// ============================================================
// GET CURRENT USER
// ============================================================
const getMe = async (req, res, next) => {
  try {
    // ========================================================
    // CHECK SESSION
    // ========================================================
    if (
      !req.session ||
      !req.session.userId
    ) {
      return res.status(401).json({
        success: false,
        error: AUTH.UNAUTHORIZED || "Authentication required. Please log in.",
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================
    const user = await User.findById(
      req.session.userId
    ).select("-passwordHash -password");

    // ========================================================
    // USER NO LONGER EXISTS
    // ========================================================
    if (!user) {
      /*
        Session points to a user that no longer exists.
        Destroy the invalid session.
      */
      return req.session.destroy(() => {
        res.clearCookie(
          SESSION_COOKIE_NAME,
          SESSION_COOKIE_OPTIONS
        );

        return res.status(401).json({
          success: false,
          error:
            AUTH.UNAUTHORIZED ||
            "Authentication required. Please log in.",
        });
      });
    }

    // ========================================================
    // SUCCESS
    // ========================================================
    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    return next(err);
  }
};

// ============================================================
// EXPORT
// ============================================================
module.exports = {
  register,
  login,
  logout,
  getMe,
};