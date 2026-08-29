const express = require('express');
const router = express.Router();
const {
  getProperties,
  createProperty,
  getPropertyById,
  deleteProperty,
  addReview
} = require('../controllers/propertyController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateProperty } = require('../middleware/validationMiddleware');

router.get('/', getProperties);
router.post('/', protect, adminOnly, upload.single('coverImage'), ...validateProperty, createProperty);
router.get('/:id', getPropertyById);
router.delete('/:id', protect, adminOnly, deleteProperty);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
