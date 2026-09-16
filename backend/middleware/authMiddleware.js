const User = require("../models/User");
const { ROLES } = require("../constants/roles");
const { AUTH } = require("../constants/responseMessages");

/*
===========================================================
GET USER FROM SESSION
===========================================================

Authentication source:
Express Session

Flow:
session cookie
    ↓
req.session.userId
    ↓
User.findById()
    ↓
user
===========================================================
*/

const getSessionUser = async (req) => {
  if (!req.session || !req.session.userId) {
    return null;
  }

  const user = await User.findById(req.session.userId).select(
    "-passwordHash -password"
  );

  return user || null;
};

/*
===========================================================
REQUIRED AUTHENTICATION
===========================================================

Used for routes where login is mandatory.

Examples:
POST /api/buildings
POST /api/maps
DELETE /api/buildings/:id
DELETE /api/maps/:id

If authenticated:
    req.user = user
    next()

If not authenticated:
    401 Unauthorized
===========================================================
*/

const protect = async (req, res, next) => {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      /*
      If the session exists but its user no longer exists,
      destroy the stale session when possible.
      */
      if (req.session?.userId && req.session.destroy) {
        req.session.destroy(() => {});
      }

      return res.status(401).json({
        success: false,
        error: AUTH.UNAUTHORIZED || "Unauthorized",
      });
    }

    /*
    Make authenticated user available
    to controllers and following middleware.
    */
    req.user = user;

    return next();
  } catch (err) {
    console.error("Authentication error:", err.message);

    return res.status(401).json({
      success: false,
      error: AUTH.UNAUTHORIZED || "Unauthorized",
    });
  }
};

/*
===========================================================
OPTIONAL AUTHENTICATION
===========================================================

Used for public routes where authentication is optional.

Not logged in:
    req.user = null
    continue

Logged in:
    req.user = user
    continue

Examples:
GET /api/buildings
GET /api/maps
GET /api/buildings/:id
GET /api/maps/:id

Important:
A failure in optional authentication must NOT
make a public endpoint fail.
===========================================================
*/

const optionalProtect = async (req, res, next) => {
  try {
    const user = await getSessionUser(req);

    req.user = user || null;

    return next();
  } catch (err) {
    console.error(
      "Optional authentication error:",
      err.message
    );

    /*
    Optional authentication must never
    break a public route.
    */
    req.user = null;

    return next();
  }
};

/*
===========================================================
ADMIN ONLY
===========================================================

This middleware assumes that `protect` has already
authenticated the request and populated req.user.

Flow:

protect
   ↓
req.user
   ↓
adminOnly
   ↓
ADMIN?
   ├── YES → next()
   └── NO  → 403
===========================================================
*/

const adminOnly = (req, res, next) => {
  if (
    req.user &&
    req.user.role === ROLES.ADMIN
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: AUTH.FORBIDDEN || "Forbidden",
  });
};

/*
===========================================================
EXPORTS
===========================================================
*/

module.exports = {
  protect,
  optionalProtect,
  adminOnly,
};