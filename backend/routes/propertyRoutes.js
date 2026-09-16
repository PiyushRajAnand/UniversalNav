const express = require("express");

const router = express.Router();

const {
  getProperties,
  createProperty,
  getPropertyById,
  deleteProperty,
  addReview,
} = require("../controllers/propertyController");

const {
  protect,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const {
  validateProperty,
} = require("../middleware/validationMiddleware");

/*
====================================================
PROPERTY ROUTES
====================================================

Public:
- GET /
- GET /:id

Authenticated:
- POST /
- DELETE /:id
- POST /:id/reviews

Authorization for modifications is handled by
propertyController.
====================================================
*/

/*
GET ALL PROPERTIES
GET /api/properties
*/

router.get(
  "/",
  getProperties
);

/*
CREATE PROPERTY
POST /api/properties

Multipart field:
coverImage
*/

router.post(
  "/",
  protect,
  upload.single("coverImage"),
  ...validateProperty,
  createProperty
);

/*
GET PROPERTY BY ID
GET /api/properties/:id
*/

router.get(
  "/:id",
  getPropertyById
);

/*
DELETE PROPERTY
DELETE /api/properties/:id
*/

router.delete(
  "/:id",
  protect,
  deleteProperty
);

/*
ADD REVIEW
POST /api/properties/:id/reviews
*/

router.post(
  "/:id/reviews",
  protect,
  addReview
);

module.exports = router;