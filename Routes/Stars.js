const express = require('express');
const router = express.Router();
const starsController = require('../Controllers/Stars_Controller');
const { protect } = require('../middleware/Auth');

// ---------------- ENCYCLOPEDIA ----------------
router.get('/encyclopedia',protect, starsController.getStarEncyclopedia);

// ---------------- USER STARS ----------------
router.get('/mystars', protect, starsController.getMyStars);

// ---------------- STAR DETAIL ----------------
router.get('/:id', protect, starsController.getStarById);

module.exports = router;
