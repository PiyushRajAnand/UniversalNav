const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/User");

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

module.exports = function (passport) {
  /*
  ============================================================
  JWT STRATEGY
  ============================================================
  */

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        if (!jwt_payload?.id) {
          return done(null, false);
        }

        const user = await User.findById(jwt_payload.id)
          .select("-password");

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (err) {
        console.error("Passport JWT error:", err.message);
        return done(err, false);
      }
    })
  );

  /*
  ============================================================
  PASSPORT SESSION SUPPORT
  ============================================================
  */

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id)
        .select("-password");

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (err) {
      console.error("Passport deserialize error:", err.message);
      return done(err, false);
    }
  });
};