const express = require('express');
const router = express.Router();
const starsController = require('../Controllers/Stars_Controller');
const { protect } = require('../middleware/Auth');

// Protected routes
router.get('/mystars', protect, starsController.getMyStars);
router.get('/:id', protect, starsController.getStarById);

module.exports = router;