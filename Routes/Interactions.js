const express = require('express');
const router = express.Router();
const interactionsController = require('../Controllers/Interactions_Controller');
const { protect } = require('../middleware/Auth');

// Protected routes
router.post('/rate', protect, interactionsController.rateObject);
router.post('/like', protect, interactionsController.likeObject);

module.exports = router;
