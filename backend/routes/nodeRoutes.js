const express = require('express');
const router = express.Router();
const { createNode, addEdge } = require('../controllers/nodeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, createNode);
router.post('/edge', protect, adminOnly, addEdge);

module.exports = router;
