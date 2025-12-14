const express = require('express');
const router = express.Router();
const likeController = require('../Controllers/Like_Controller');
const { protect } = require('../middleware/Auth');

// Toggle like/unlike for a star, planet, or moon
router.post('/toggle', protect, likeController.toggleLike);

// Get like status for a specific object
router.get('/status', protect, likeController.getLikeStatus);

module.exports = router;
