const express = require("express");

const router = express.Router();

const {
  createNode,
  addEdge,
} = require("../controllers/nodeController");

const {
  protect,
} = require("../middleware/authMiddleware");

/*
====================================================
NODE ROUTES
====================================================

Authentication is required.

Authorization is handled inside the controller
because the controller must determine the
building associated with the floor/node.

Allowed:
- Building owner
- Admin
====================================================
*/

/*
CREATE NODE
POST /api/nodes
*/

router.post(
  "/",
  protect,
  createNode
);

/*
CREATE EDGE
POST /api/nodes/edge
*/

router.post(
  "/edge",
  protect,
  addEdge
);

module.exports = router;