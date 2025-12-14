// Routes/Users.js
const express = require('express');
const router = express.Router();

const userController = require('../controllers/Users_Controller');
const { protect } = require('../middleware/Auth');

// Public auth routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);

// Protected route
router.get('/account', protect, userController.getAccountDetails);

module.exports = router;
