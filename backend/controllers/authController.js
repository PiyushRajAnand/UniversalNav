const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { AUTH } = require("../constants/responseMessages");

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
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: AUTH.USER_EXISTS || "User already exists",
      });
    }

    // ========================================================
    // CREATE USER
    // ========================================================
    // IMPORTANT:
    // Never accept role from the frontend during registration.
    // User model should apply its default role.
    // ========================================================

    const newUser = await User.create({
      name,
      email,
      passwordHash: password,
    });

    // ========================================================
    // CREATE NEW SESSION
    // ========================================================

    req.session.regenerate((err) => {
      if (err) {
        console.error(
          "Session regeneration error:",
          err
        );

        return next(err);
      }

      // Store authenticated user's ID
      req.session.userId =
        newUser._id.toString();

      // ======================================================
      // SAVE SESSION
      // ======================================================

      req.session.save(async (saveErr) => {
        if (saveErr) {
          console.error(
            "Session save error:",
            saveErr
          );

          return next(saveErr);
        }

        // ====================================================
        // AUDIT LOG
        // ====================================================

        try {
          await AuditLog.create({
            userId: newUser._id,
            email: newUser.email,
            action: "LOGIN",
            ipAddress: req.ip,
          });

          // ==================================================
          // SUCCESS
          // ==================================================

          return res.status(201).json({
            success: true,
            message:
              AUTH.REGISTER_SUCCESS ||
              "Registration successful",

            user: {
              id: newUser._id,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
            },
          });
        } catch (auditError) {
          return next(auditError);
        }
      });
    });
  } catch (err) {
    next(err);
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

    const user = await User.findOne({
      email,
    });

    // ========================================================
    // VALIDATE CREDENTIALS
    // ========================================================

    if (
      !user ||
      !(await user.comparePassword(password))
    ) {
      return res.status(401).json({
        success: false,
        error:
          AUTH.INVALID_CREDENTIALS ||
          "Invalid email or password",
      });
    }

    // ========================================================
    // REGENERATE SESSION
    // ========================================================
    // Prevents session fixation after login.
    // ========================================================

    req.session.regenerate((err) => {
      if (err) {
        console.error(
          "Session regeneration error:",
          err
        );

        return next(err);
      }

      // ======================================================
      // STORE USER ID
      // ======================================================

      req.session.userId =
        user._id.toString();

      // ======================================================
      // SAVE SESSION
      // ======================================================

      req.session.save(async (saveErr) => {
        if (saveErr) {
          console.error(
            "Session save error:",
            saveErr
          );

          return next(saveErr);
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

          // ==================================================
          // SUCCESS
          // ==================================================

          return res.json({
            success: true,
            message:
              AUTH.LOGIN_SUCCESS ||
              "Login successful",

            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          });
        } catch (auditError) {
          return next(auditError);
        }
      });
    });
  } catch (err) {
    next(err);
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
        Audit failure should not prevent the user
        from being logged out.
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
          error: "Could not log out.",
        });
      }

      // ======================================================
      // CLEAR SESSION COOKIE
      // ======================================================

      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      return res.json({
        success: true,
        message:
          AUTH.LOGOUT_SUCCESS ||
          "Logged out successfully",
      });
    });
  } catch (err) {
    next(err);
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
        error: "Not authenticated",
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
      The session points to a user that no longer exists.
      Destroy the invalid session.
      */

      return req.session.destroy(() => {
        return res.status(401).json({
          success: false,
          error: "Not authenticated",
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
    next(err);
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