const express = require('express');
const router = express.Router();
const { createFloor } = require('../controllers/floorController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, adminOnly, upload.single('mapImage'), createFloor);

module.exports = router;
