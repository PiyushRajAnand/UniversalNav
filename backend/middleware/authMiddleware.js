const User = require("../models/User");
const { ROLES } = require("../constants/roles");
const { AUTH } = require("../constants/responseMessages");

/*
===========================================================
GET USER FROM SESSION
===========================================================
*/
const getSessionUser = async (req) => {
  if (!req.session || !req.session.userId) {
    return null;
  }

  const user = await User.findById(req.session.userId)
    .select("-passwordHash -password");

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

Authentication source:
Express Session
===========================================================
*/

const protect = async (req, res, next) => {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: AUTH.UNAUTHORIZED || "Unauthorized",
      });
    }

    /*
    Make authenticated user available
    to all following route handlers.
    */

    req.user = user;

    next();
  } catch (err) {
    console.error(
      "Authentication error:",
      err.message
    );

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

Not logged in:
    req.user = null
    continue

Logged in:
    req.user = user
    continue

Used for public routes where logged-in users
should additionally see/access their own private data.

Examples:
GET /api/buildings
GET /api/maps
GET /api/buildings/:id
GET /api/maps/:id
===========================================================
*/

const optionalProtect = async (req, res, next) => {
  try {
    const user = await getSessionUser(req);

    req.user = user || null;

    next();
  } catch (err) {
    console.error(
      "Optional authentication error:",
      err.message
    );

    /*
    Optional authentication must never
    break public routes.
    */

    req.user = null;

    next();
  }
};

/*
===========================================================
ADMIN ONLY
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

module.exports = {
  protect,
  optionalProtect,
  adminOnly,
};