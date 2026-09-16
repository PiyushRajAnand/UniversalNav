const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ============================================================
// UPLOAD DIRECTORIES
// ============================================================

const uploadRoot = path.join(
  __dirname,
  "..",
  "uploads"
);

const uploadDirectories = {
  coverImage: path.join(uploadRoot, "covers"),
  mapImage: path.join(uploadRoot, "floors"),
  qrCode: path.join(uploadRoot, "qr"),
};

// ============================================================
// ENSURE DIRECTORIES EXIST
// ============================================================

Object.values(uploadDirectories).forEach((directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }
});

// ============================================================
// STORAGE
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destination =
      uploadDirectories[file.fieldname];

    if (!destination) {
      return cb(
        new Error(
          "Unsupported upload field."
        )
      );
    }

    return cb(null, destination);
  },

  filename: (req, file, cb) => {
    const extension =
      path
        .extname(file.originalname)
        .toLowerCase();

    const uniqueSuffix =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}`;

    const safeFieldName =
      file.fieldname.replace(
        /[^a-zA-Z0-9_-]/g,
        ""
      );

    cb(
      null,
      `${safeFieldName}-${uniqueSuffix}${extension}`
    );
  },
});

// ============================================================
// FILE FILTER
// ============================================================

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const extension =
    path
      .extname(file.originalname)
      .toLowerCase();

  const isAllowedExtension =
    allowedExtensions.includes(extension);

  const isAllowedMimeType =
    allowedMimeTypes.includes(file.mimetype);

  if (
    isAllowedExtension &&
    isAllowedMimeType
  ) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, PNG, and WEBP image files are allowed."
    )
  );
};

// ============================================================
// MULTER
// ============================================================

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },

  fileFilter,
});

// ============================================================
// EXPORT
// ============================================================

module.exports = upload;