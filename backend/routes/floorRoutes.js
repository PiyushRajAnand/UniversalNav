const express = require("express");

const router = express.Router();

const {
  createFloor,
} = require("../controllers/floorController");

const {
  protect,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

/*
====================================================
FLOOR ROUTES
====================================================

Authentication is required.

Authorization is handled by floorController,
because it must determine which Building owns
the requested floor.

Allowed:
- Building owner
- Admin
====================================================
*/

/*
CREATE FLOOR
POST /api/floors

Multipart field:
mapImage
*/

router.post(
  "/",
  protect,
  upload.single("mapImage"),
  createFloor
);

module.exports = router;