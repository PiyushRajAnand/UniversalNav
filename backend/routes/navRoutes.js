const express = require('express');
const router = express.Router();
const { calculatePath } = require('../controllers/navController');
const { validateNavigation } = require('../middleware/validationMiddleware');

router.get('/', ...validateNavigation, calculatePath);

module.exports = router;
