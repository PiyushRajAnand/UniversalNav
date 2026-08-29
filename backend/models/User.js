const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ==========================================================
    // USER NAME
    // ==========================================================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================================
    // EMAIL
    // ==========================================================
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // ==========================================================
    // PASSWORD HASH
    // ==========================================================
    // IMPORTANT:
    // Never store the plain password.
    // The pre-save hook below converts it into a bcrypt hash.
    // ==========================================================
    passwordHash: {
      type: String,
      required: true,
    },

    // ==========================================================
    // ROLE
    // ==========================================================
    // Registration must NOT be allowed to choose this.
    // authController.js now deliberately does not accept req.body.role.
    // ==========================================================
    role: {
      type: String,
      enum: ["Admin", "Editor", "Viewer"],
      default: "Editor",
    },

    // ==========================================================
    // AVATAR
    // ==========================================================
    avatarUrl: {
      type: String,
      default: "",
    },

    // ==========================================================
    // FAVORITES
    // ==========================================================
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Building",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ============================================================
// HASH PASSWORD BEFORE SAVE
// ============================================================

userSchema.pre("save", async function (next) {
  try {
    /*
    If passwordHash has not changed, don't hash it again.

    This is important because updating a user such as:
      name
      avatarUrl
      role

    should NOT hash the existing bcrypt hash again.
    */

    if (!this.isModified("passwordHash")) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);

    this.passwordHash = await bcrypt.hash(
      this.passwordHash,
      salt
    );

    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================
// COMPARE LOGIN PASSWORD
// ============================================================

userSchema.methods.comparePassword = async function (
  candidatePassword
) {
  return bcrypt.compare(
    candidatePassword,
    this.passwordHash
  );
};

// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model(
  "User",
  userSchema
);